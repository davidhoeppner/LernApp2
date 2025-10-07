/* global URL */
import StorageService from './StorageService.js';

/**
 * ExamProgressService - Tracks and analyzes exam preparation progress
 * Provides insights into weak areas, exam readiness, and personalized recommendations
 */
class ExamProgressService {
  constructor(stateManager, ihkContentService) {
    this.stateManager = stateManager;
    this.ihkContentService = ihkContentService;
    this.storage = new StorageService('exam-progress');
  }

  /**
   * Get progress breakdown by exam category (FÜ-01, BP-01, etc.)
   */
  async getProgressByCategory() {
    try {
      // Load categories
      const categories = await this.ihkContentService.loadCategories();
      const progress = this.stateManager.getState('progress') || {};
      const completed = progress.modulesCompleted || [];
      const inProgress = progress.modulesInProgress || [];

      // Load all modules
      await this.ihkContentService._loadAllModules();
      const allModules = Array.from(this.ihkContentService.modules.values());

      const categoryProgress = [];

      // Process each main category (FÜ and BP)
      for (const mainCategory of categories.categories) {
        // Process each subcategory
        for (const subcategory of mainCategory.subcategories) {
          const categoryModules = allModules.filter(
            m => m.category === subcategory.id
          );

          const totalModules = categoryModules.length;
          const completedModules = categoryModules.filter(m =>
            completed.includes(m.id)
          ).length;
          const inProgressModules = categoryModules.filter(m =>
            inProgress.includes(m.id)
          ).length;

          const completionPercentage =
            totalModules > 0
              ? Math.round((completedModules / totalModules) * 100)
              : 0;

          categoryProgress.push({
            categoryId: subcategory.id,
            categoryCode: subcategory.code,
            categoryName: subcategory.name,
            mainCategory: mainCategory.code,
            examRelevance: subcategory.examRelevance,
            totalModules,
            completedModules,
            inProgressModules,
            notStartedModules:
              totalModules - completedModules - inProgressModules,
            completionPercentage,
            status:
              completionPercentage === 100
                ? 'completed'
                : completionPercentage > 0
                  ? 'in-progress'
                  : 'not-started',
          });
        }
      }

      // Sort by exam relevance and completion
      categoryProgress.sort((a, b) => {
        const relevanceOrder = { high: 0, medium: 1, low: 2 };
        const relevanceDiff =
          relevanceOrder[a.examRelevance] - relevanceOrder[b.examRelevance];
        if (relevanceDiff !== 0) return relevanceDiff;
        return b.completionPercentage - a.completionPercentage;
      });

      return categoryProgress;
    } catch (error) {
      console.error('Error getting progress by category:', error);
      throw new Error('Failed to calculate category progress');
    }
  }

  /**
   * Identify weak areas based on quiz performance and incomplete modules
   * Analyzes three types of weaknesses:
   * 1. Low quiz performance (< 70% average score)
   * 2. Incomplete high-relevance categories
   * 3. Uncompleted new 2025 topics
   * @returns {Promise<Array>} Array of weak areas with severity and recommendations
   */
  async getWeakAreas() {
    try {
      const progress = this.stateManager.getState('progress') || {};
      const quizAttempts = progress.quizAttempts || [];
      const completed = progress.modulesCompleted || [];

      const weakAreas = [];

      // Analyze quiz performance by category
      const quizPerformanceByCategory = new Map();

      for (const attempt of quizAttempts) {
        // Get quiz details to find category
        const quizId = attempt.quizId;
        const categoryMatch = quizId.match(/^(fue|bp)-\d+/i);

        if (categoryMatch) {
          const category = categoryMatch[0].toUpperCase();
          const score = attempt.score;

          if (!quizPerformanceByCategory.has(category)) {
            quizPerformanceByCategory.set(category, []);
          }
          quizPerformanceByCategory.get(category).push(score);
        }
      }

      // Identify categories with low quiz scores (< 70%)
      for (const [category, scores] of quizPerformanceByCategory) {
        const avgScore =
          scores.reduce((sum, score) => sum + score, 0) / scores.length;

        if (avgScore < 70) {
          weakAreas.push({
            type: 'quiz-performance',
            category,
            averageScore: Math.round(avgScore),
            attempts: scores.length,
            severity: avgScore < 50 ? 'high' : avgScore < 60 ? 'medium' : 'low',
            recommendation: `Wiederhole die Module in ${category} und übe mehr Quizzes`,
          });
        }
      }

      // Identify high-relevance categories with low completion
      const categoryProgress = await this.getProgressByCategory();

      for (const cat of categoryProgress) {
        if (cat.examRelevance === 'high' && cat.completionPercentage < 50) {
          weakAreas.push({
            type: 'incomplete-category',
            category: cat.categoryCode,
            categoryName: cat.categoryName,
            completionPercentage: cat.completionPercentage,
            severity:
              cat.completionPercentage === 0
                ? 'high'
                : cat.completionPercentage < 25
                  ? 'medium'
                  : 'low',
            recommendation: `Fokussiere dich auf ${cat.categoryName} - hohe Prüfungsrelevanz!`,
          });
        }
      }

      // Identify new 2025 topics not yet completed
      const newTopics = await this.ihkContentService.getNewTopics2025();
      const uncompletedNewTopics = newTopics.filter(
        m => !completed.includes(m.id)
      );

      if (uncompletedNewTopics.length > 0) {
        weakAreas.push({
          type: 'new-topics-2025',
          count: uncompletedNewTopics.length,
          topics: uncompletedNewTopics.map(m => m.title),
          severity: 'high',
          recommendation:
            'Neue Themen ab 2025 sind besonders prüfungsrelevant - starte hier!',
        });
      }

      // Sort by severity
      const severityOrder = { high: 0, medium: 1, low: 2 };
      weakAreas.sort(
        (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
      );

      return weakAreas;
    } catch (error) {
      console.error('Error identifying weak areas:', error);
      throw new Error('Failed to identify weak areas');
    }
  }

  /**
   * Calculate overall exam readiness score (0-100)
   * Uses weighted formula: 50% module completion + 30% quiz performance + 20% new topics coverage
   * Module completion is weighted by exam relevance (high=3, medium=2, low=1)
   * @returns {Promise<Object>} Readiness object with score, level, recommendation, and breakdown
   */
  async getExamReadiness() {
    try {
      const progress = this.stateManager.getState('progress') || {};
      const completed = progress.modulesCompleted || [];
      const quizAttempts = progress.quizAttempts || [];

      // Load all modules
      await this.ihkContentService._loadAllModules();
      const allModules = Array.from(this.ihkContentService.modules.values());

      // Calculate weighted completion by exam relevance
      let totalWeight = 0;
      let completedWeight = 0;

      const relevanceWeights = { high: 3, medium: 2, low: 1 };

      for (const module of allModules) {
        const weight = relevanceWeights[module.examRelevance] || 1;
        totalWeight += weight;

        if (completed.includes(module.id)) {
          completedWeight += weight;
        }
      }

      const moduleReadiness =
        totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

      // Calculate quiz readiness (average score)
      let quizReadiness = 0;
      if (quizAttempts.length > 0) {
        const totalScore = quizAttempts.reduce(
          (sum, attempt) => sum + attempt.score,
          0
        );
        quizReadiness = totalScore / quizAttempts.length;
      }

      // Check new 2025 topics coverage
      const newTopics = await this.ihkContentService.getNewTopics2025();
      const completedNewTopics = newTopics.filter(m =>
        completed.includes(m.id)
      ).length;
      const newTopicsReadiness =
        newTopics.length > 0
          ? (completedNewTopics / newTopics.length) * 100
          : 100;

      // Overall readiness: 50% modules, 30% quizzes, 20% new topics
      const overallReadiness = Math.round(
        moduleReadiness * 0.5 + quizReadiness * 0.3 + newTopicsReadiness * 0.2
      );

      // Determine readiness level
      let readinessLevel;
      let recommendation;

      if (overallReadiness >= 85) {
        readinessLevel = 'excellent';
        recommendation =
          'Du bist sehr gut vorbereitet! Wiederhole schwierige Themen und mache Prüfungssimulationen.';
      } else if (overallReadiness >= 70) {
        readinessLevel = 'good';
        recommendation =
          'Gute Vorbereitung! Fokussiere dich auf deine Schwachstellen und übe mehr Quizzes.';
      } else if (overallReadiness >= 50) {
        readinessLevel = 'moderate';
        recommendation =
          'Du bist auf einem guten Weg. Arbeite systematisch die fehlenden Module durch.';
      } else if (overallReadiness >= 30) {
        readinessLevel = 'needs-improvement';
        recommendation =
          'Du brauchst noch mehr Vorbereitung. Erstelle einen Lernplan und arbeite täglich daran.';
      } else {
        readinessLevel = 'insufficient';
        recommendation =
          'Starte jetzt mit deiner Vorbereitung! Beginne mit den wichtigsten Themen (hohe Prüfungsrelevanz).';
      }

      return {
        overallReadiness,
        readinessLevel,
        recommendation,
        breakdown: {
          moduleReadiness: Math.round(moduleReadiness),
          quizReadiness: Math.round(quizReadiness),
          newTopicsReadiness: Math.round(newTopicsReadiness),
        },
        statistics: {
          totalModules: allModules.length,
          completedModules: completed.length,
          quizzesTaken: quizAttempts.length,
          newTopicsCompleted: completedNewTopics,
          totalNewTopics: newTopics.length,
        },
      };
    } catch (error) {
      console.error('Error calculating exam readiness:', error);
      throw new Error('Failed to calculate exam readiness');
    }
  }

  /**
   * Get personalized module recommendations based on weak areas
   */
  async getRecommendedModules() {
    try {
      const weakAreas = await this.getWeakAreas();
      const progress = this.stateManager.getState('progress') || {};
      const completed = progress.modulesCompleted || [];
      const inProgress = progress.modulesInProgress || [];

      const recommendations = [];

      // Load all modules
      await this.ihkContentService._loadAllModules();
      const allModules = Array.from(this.ihkContentService.modules.values());

      // 1. Recommend modules for weak quiz performance categories
      for (const weak of weakAreas) {
        if (weak.type === 'quiz-performance') {
          const categoryModules = allModules
            .filter(
              m =>
                m.category.startsWith(weak.category) &&
                !completed.includes(m.id)
            )
            .slice(0, 3);

          if (categoryModules.length > 0) {
            recommendations.push({
              reason: `Schwache Quiz-Performance in ${weak.category}`,
              priority: weak.severity,
              modules: categoryModules,
            });
          }
        }
      }

      // 2. Recommend incomplete high-relevance modules
      const highRelevanceIncomplete = allModules
        .filter(
          m =>
            m.examRelevance === 'high' &&
            !completed.includes(m.id) &&
            !inProgress.includes(m.id)
        )
        .slice(0, 5);

      if (highRelevanceIncomplete.length > 0) {
        recommendations.push({
          reason: 'Hohe Prüfungsrelevanz',
          priority: 'high',
          modules: highRelevanceIncomplete,
        });
      }

      // 3. Recommend new 2025 topics
      const newTopics = await this.ihkContentService.getNewTopics2025();
      const uncompletedNewTopics = newTopics
        .filter(m => !completed.includes(m.id))
        .slice(0, 5);

      if (uncompletedNewTopics.length > 0) {
        recommendations.push({
          reason: 'Neue Themen ab 2025',
          priority: 'high',
          modules: uncompletedNewTopics,
        });
      }

      // 4. Recommend modules with prerequisites met
      const modulesWithMetPrerequisites = allModules.filter(m => {
        if (completed.includes(m.id) || inProgress.includes(m.id)) {
          return false;
        }

        // Check if all prerequisites are completed
        if (m.prerequisites && m.prerequisites.length > 0) {
          return m.prerequisites.every(prereq => completed.includes(prereq));
        }

        return false;
      });

      if (modulesWithMetPrerequisites.length > 0) {
        recommendations.push({
          reason: 'Voraussetzungen erfüllt',
          priority: 'medium',
          modules: modulesWithMetPrerequisites.slice(0, 3),
        });
      }

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      recommendations.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );

      return recommendations;
    } catch (error) {
      console.error('Error getting recommended modules:', error);
      throw new Error('Failed to generate module recommendations');
    }
  }

  /**
   * Get progress for a specific category
   */
  getCategoryProgress(categoryId) {
    try {
      const progress = this.stateManager.getState('progress') || {};
      const completed = progress.modulesCompleted || [];

      // Load all modules synchronously from cache
      const allModules = Array.from(this.ihkContentService.modules.values());
      const categoryModules = allModules.filter(m => m.category === categoryId);

      if (categoryModules.length === 0) {
        return 0;
      }

      const completedCount = categoryModules.filter(m =>
        completed.includes(m.id)
      ).length;

      return Math.round((completedCount / categoryModules.length) * 100);
    } catch (error) {
      console.error(
        `Error getting category progress for ${categoryId}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Export comprehensive exam progress report as JSON file
   * Includes readiness score, category progress, weak areas, and recommendations
   * Automatically triggers browser download of the JSON file
   * @returns {Promise<Object>} The exported data object
   */
  async exportProgress() {
    try {
      const progress = this.stateManager.getState('progress') || {};
      const categoryProgress = await this.getProgressByCategory();
      const weakAreas = await this.getWeakAreas();
      const examReadiness = await this.getExamReadiness();
      const recommendations = await this.getRecommendedModules();

      const exportData = {
        exportDate: new Date().toISOString(),
        examType: 'IHK Fachinformatiker Anwendungsentwicklung AP2',
        examVersion: '2025',
        summary: {
          examReadiness: examReadiness.overallReadiness,
          readinessLevel: examReadiness.readinessLevel,
          totalModulesCompleted: progress.modulesCompleted?.length || 0,
          totalQuizzesTaken: progress.quizAttempts?.length || 0,
          lastActivity: progress.lastActivity,
        },
        examReadiness,
        categoryProgress,
        weakAreas,
        recommendations: recommendations.map(rec => ({
          reason: rec.reason,
          priority: rec.priority,
          moduleCount: rec.modules.length,
          modules: rec.modules.map(m => ({
            id: m.id,
            title: m.title,
            category: m.category,
            examRelevance: m.examRelevance,
          })),
        })),
        detailedProgress: {
          modulesCompleted: progress.modulesCompleted || [],
          modulesInProgress: progress.modulesInProgress || [],
          quizAttempts: (progress.quizAttempts || []).map(attempt => ({
            quizId: attempt.quizId,
            score: attempt.score,
            date: attempt.date,
            passed: attempt.score >= 70,
          })),
        },
      };

      // Convert to JSON string with formatting
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ihk-exam-progress-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return exportData;
    } catch (error) {
      console.error('Error exporting exam progress:', error);
      throw new Error('Failed to export exam progress');
    }
  }
}

export default ExamProgressService;
