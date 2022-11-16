const core = require('@actions/core');
const github = require('@actions/github');
const { Buffer } = require('buffer');
const fileSystem = require('fs');
const axios = require('axios');
var FormData = require('form-data');
const parseComments = require('parse-html-comments')


async function upgrade(mail, layout, data) {

    // api urls
    const urls = {
        template:  `https://${mail.host}/v3/${mail.domainName}/templates/${data.key}`,
        templates: `https://${mail.host}/v3/${mail.domainName}/templates`,
        versions:  `https://${mail.host}/v3/${mail.domainName}/templates/${data.key}/versions`
    };

    // headers
    var options = {
        headers: {
            "Authorization": `Basic ${Buffer.from(`api:${mail.apiKey}`).toString('base64')}`,
        }
    };

    // check if template exist
    try {
        var exists = await axios.get(urls.template, options);
        console.log(`Template ${exists.data.template.name} exists.`);
    }catch(err) {
        // create if not exists
        console.log(`Template ${data.key} doesnt exists (error code: ${err.response.status}). Try to create...`);

        var params = new FormData();
        params.append('name', data.key);
        params.append('description', data.description);

        await axios.post(urls.templates, params, options);

        console.log(`Template ${data.key} created!`);
    }

    // delete oldest template version before add new version
    // get all versions
    try {
        var tpls = await axios.get(urls.versions, options);
        console.log(`Template versions got on ${urls.versions} are ${tpls.data.template.versions.length}.`);
    } catch (tplerr) {
        console.log(`Templates versions couldnt be retrieved (error code: ${tplerr.response.status}).`);
    }

    // first version is the newest, so take the last to delete
    // var length = tpls.data.template.versions.length;
    while(tpls.data.template.versions.length > mail.templateVersionLimit){
        try {
            var version = tpls.data.template.versions.pop();
            console.log(`Start to delete version ${version.tag} (${tpls.data.template.versions.length}) with date ${version.createdAt}.`)
            var deleteUrl = urls.versions + '/' + version.tag;
            var deleted = await  axios.delete(deleteUrl, options);
            console.log(`Template ${deleted.data.template.name} version ${deleted.data.template.version.tag} deleted.`);
        } catch (delerr) {
            console.log(`Template ${data.key} version ${version.tag} didnt deleted  with url <${deleteUrl}>(error code: ${delerr.response.status}). Trying to delete...`);
        }
    }
    /** ******  part for delete all versions until a minimum number of them (until  10 for each here) ****/
    // var count = 1;
    // while ( (length - count) > 10){
    //     try {
    //         var version = tpls.data.template.versions[length - count];
    //         console.log(`Start to delete version ${version.tag} (${length-count}) with date ${version.createdAt}.`)
    //         var deleted = await  axios.delete(urls.versions + '/' + version.tag, options);
    //         console.log(`Template ${deleted.data.template.name} version ${deleted.data.template.version.tag} deleted.`);
    //     } catch (delerr) {
    //         console.log(`Template ${data.key} version ${version.tag} doesnt exists (error code: ${delerr.response.status}). Trying to delete...`);
    //     }
    //     count++;

    // }
    /** ********** end delete multiple versions ********/
    
    // Extract HTML content
    var content = fileSystem.readFileSync(data.html, { encoding: 'utf-8' });
    var html = makeTemplate(layout.content, content, layout.replace);

    // Create a new active version of template

    console.log(`Creating version for Mailgun template '${data.key}'...`);

    var params = new FormData();
    params.append('tag', mail.commit);
    params.append('template', html);
    params.append('engine', 'handlebars');
    params.append('active', 'yes');
    params.append('comment', data.description);
    
    var response = await axios.post(urls.versions, params, options);

    console.log(`Version for template '${data.key}' created!`);
}

function makeTemplate(layout, content, replaceWord) {
    return layout.replace(replaceWord, content);
}

(async () => {
    const htmlFile = "test/templates/content/test-1.html";
    const templatesDir = "test/templates/content";

    var content = fileSystem.readFileSync(htmlFile, { encoding: 'utf-8' });

    var comments = parseComments(content);

    var comment = comments.matches[0].groups.commentOnly.replace("<!--", "").replace("-->", "").replace(/(^\s*(?!.+)\n+)|(\n+\s+(?!.+)$)/g, "").trim();
    // console.log(comments.matches[0].groups.commentOnly.replace("<!--", "").replace("-->", "").replace(/(^\s*(?!.+)\n+)|(\n+\s+(?!.+)$)/g, "").trim());
    console.log(comment);
    try {
        var json = JSON.parse(comment);
        console.log(json);
    } catch(e) {
        console.error("Not is valid json");
    }
    
    // var files = [];
    var files = await fileSystem.promises.readdir(templatesDir);

    var htmls = files.filter((file) => { return file.substring(file.length-5) === '.html'; });
    console.log(htmls);
})();
