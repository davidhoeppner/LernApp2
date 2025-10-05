/* global Blob, URL */
import modulesData from '../data/modules.json';

import StorageService from './StorageService.js';
import { EXAM, PROGRESS_WEIGHTS, PROGRESS_STATUS } from '../utils/constants.js';

/**
 * ProgressService - Tracks and calculates user progress
 */
class ProgressService {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.storage = new StorageService();
    this.totalModules = modulesData.length;
  }

  /**
   * Get overall progress percentage
   */
  getOverallProgress() {
    try {
      const progress = this.stateManager.getState('progress') || {};
      const modulesCompleted = progress.modulesCompleted || [];
      const quizAttempts = progress.quizAttempts || [];

      // Calculate module completion percentage
      const moduleCompletionPercentage =
        this.totalModules > 0
          ? Math.round((modulesCompleted.length / this.totalModules) * 100)
          : 0;

      // Calculate average quiz score
      let averageQuizScore = 0;
      if (quizAttempts.length > 0) {
        const totalScore = quizAttempts.reduce(
          (sum, attempt) => sum + attempt.score,
          0
        );
        averageQuizScore = Math.round(totalScore / quizAttempts.length);
      }

      // Overall progress is weighted: 70% modules, 30% quizzes
      const overallPercentage = Math.round(
        moduleCompletionPercentage * PROGRESS_WEIGHTS.MODULE_COMPLETION +
          averageQuizScore * PROGRESS_WEIGHTS.QUIZ_AVERAGE
      );

      return {
        overallPercentage,
        modulesCompleted: modulesCompleted.length,
        totalModules: this.totalModules,
        moduleCompletionPercentage,
        quizzesTaken: quizAttempts.length,
        averageQuizScore,
        lastActivity: progress.lastActivity || null,
      };
    } catch (error) {
      console.error('Error getting overall progress:', error);
      throw new Error('Failed to calculate overall progress');
    }
  }

  /**
   * Get progress for individual module
   */
  getModuleProgress(moduleId) {
    try {
      if (!moduleId || typeof moduleId !== 'string') {
        throw new Error('Invalid module ID');
      }

      const progress = this.stateManager.getState('progress') || {};
      const modulesCompleted = progress.modulesCompleted || [];
      const modulesInProgress = progress.modulesInProgress || [];

      const isCompleted = modulesCompleted.includes(moduleId);
      const isInProgress = modulesInProgress.includes(moduleId);

      return {
        moduleId,
        completed: isCompleted,
        inProgress: isInProgress,
        status: isCompleted
          ? PROGRESS_STATUS.COMPLETED
          : isInProgress
            ? PROGRESS_STATUS.IN_PROGRESS
            : PROGRESS_STATUS.NOT_STARTED,
      };
    } catch (error) {
      console.error(`Error getting module progress for ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get quiz history with past attempts
   */
  getQuizHistory() {
    try {
      const progress = this.stateManager.getState('progress') || {};
      const quizAttempts = progress.quizAttempts || [];

      // Sort by date (most recent first)
      const sortedAttempts = [...quizAttempts].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      return sortedAttempts.map(attempt => ({
        quizId: attempt.quizId,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        date: attempt.date,
        passed: attempt.score >= EXAM.PASSING_SCORE_PERCENTAGE,
      }));
    } catch (error) {
      console.error('Error getting quiz history:', error);
      throw new Error('Failed to retrieve quiz history');
    }
  }

  /**
   * Update progress for all activity types
   */
  updateProgress(type, id, data) {
    try {
      if (!type || !id) {
        throw new Error('Invalid parameters: type and id are required');
      }

      const progress = this.stateManager.getState('progress') || {};

      switch (type) {
        case 'module-complete':
          {
            const modulesCompleted = progress.modulesCompleted || [];
            const modulesInProgress = progress.modulesInProgress || [];

            // Add to completed
            if (!modulesCompleted.includes(id)) {
              this.stateManager.setState('progress.modulesCompleted', [
                ...modulesCompleted,
                id,
              ]);
            }

            // Remove from in progress
            if (modulesInProgress.includes(id)) {
              this.stateManager.setState(
                'progress.modulesInProgress',
                modulesInProgress.filter(moduleId => moduleId !== id)
              );
            }
          }
          break;

        case 'module-start':
          {
            const modulesCompleted = progress.modulesCompleted || [];
            const modulesInProgress = progress.modulesInProgress || [];

            // Add to in progress if not completed
            if (
              !modulesCompleted.includes(id) &&
              !modulesInProgress.includes(id)
            ) {
              this.stateManager.setState('progress.modulesInProgress', [
                ...modulesInProgress,
                id,
              ]);
            }
          }
          break;

        case 'quiz-complete':
          {
            if (!data || !data.score || !data.answers) {
              throw new Error(
                'Quiz completion requires score and answers data'
              );
            }

            const quizAttempts = progress.quizAttempts || [];
            const attempt = {
              quizId: id,
              score: data.score,
              totalQuestions: data.totalQuestions || data.answers.length,
              correctAnswers: data.correctAnswers || 0,
              date: new Date().toISOString(),
              answers: data.answers,
            };

            this.stateManager.setState('progress.quizAttempts', [
              ...quizAttempts,
              attempt,
            ]);
          }
          break;

        default:
          throw new Error(`Unknown progress type: ${type}`);
      }

      // Update last activity timestamp
      this.stateManager.setState(
        'progress.lastActivity',
        new Date().toISOString()
      );

      return true;
    } catch (error) {
      console.error(`Error updating progress for ${type} ${id}:`, error);
      throw error;
    }
  }

  /**
   * Export progress as JSON
   */
  exportProgress() {
    try {
      const progress = this.stateManager.getState('progress') || {};
      const overallProgress = this.getOverallProgress();

      const exportData = {
        exportDate: new Date().toISOString(),
        summary: overallProgress,
        details: {
          modulesCompleted: progress.modulesCompleted || [],
          modulesInProgress: progress.modulesInProgress || [],
          quizAttempts: progress.quizAttempts || [],
          lastActivity: progress.lastActivity,
        },
      };

      // Convert to JSON string with formatting
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `learning-progress-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return exportData;
    } catch (error) {
      console.error('Error exporting progress:', error);
      throw new Error('Failed to export progress data');
    }
  }
}

export default ProgressService;
