// @ts-nocheck
/* eslint-env node */
import IHKContentService from '../src/services/IHKContentService.js';

(async function () {
  try {
    const ihk = new IHKContentService(
      { getState: () => ({}) },
      null,
      null,
      null,
      null,
      null
    );
    const modules = await ihk.getAllModules();
    const quizzes = await ihk.getAllQuizzes();
    console.log('Total modules:', modules.length);
    console.log(
      'Module IDs sample:',
      modules.slice(-10).map(m => m.id)
    );
    console.log('Total quizzes:', quizzes.length);
    console.log(
      'Quiz IDs sample:',
      quizzes.slice(-10).map(q => q.id)
    );
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
