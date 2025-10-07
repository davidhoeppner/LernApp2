import IHKContentService from '../src/services/IHKContentService.js';

(async () => {
  try {
    const ihk = new IHKContentService(
      { getState: () => ({}) },
      null,
      null,
      null,
      null,
      null
    );
    const module = await ihk.getModuleById('fue-04-security');
    console.log('id:', module.id);
    console.log('title:', module.title);
    console.log('description (raw):');
    console.log(JSON.stringify(module.description));
    console.log('\ncontent (first 800 chars, raw):');
    console.log(JSON.stringify(module.content).slice(0, 800));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
