const core = require('@actions/core');
const github = require('@actions/github');
const { Buffer } = require('buffer');
const fs = require('fs');

const mailgun = require("./mailgun-templates-client.js");
const template = require("./template.js");

async function update(client, template) {

    // create template
    try {
        await client.createIfNotExists(template);
    } catch(err) {
        console.error(`Template ${template.name} not created!!`);
        core.setFailed(err);
    }

    await client.cleanVersions(template);

    try {
        await client.createVersionAndActivate(template)
    } catch(err) {
        console.error(`Template ${template.name} version not created!!`);
        core.setFailed(err);
    }
}

(async () => {
    try {
        const templatesDir = core.getInput('templates-directory');
        const templateLayout = core.getInput('layout');
        const commit = github.context.sha;
        
        const client = mailgun.client(
            core.getInput('mailgun-api-key'),
            core.getInput('mailgun-domain-name'),
            core.getInput('mailgun-host'),
            Number(core.getInput('mailgun-template-versions-limit'))
        );

        var files = await fs.promises.readdir(templatesDir);

        var htmls = files.filter((file) => { return file.substring(file.length-5) === '.html'; });
        for(const html of htmls) {
            await update(client, template.parse(templatesDir + "/" + html, commit, templateLayout));
        }

    } catch (err) {
        core.setFailed(err);
    }
})();
