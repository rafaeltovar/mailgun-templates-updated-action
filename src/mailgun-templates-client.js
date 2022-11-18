const axios = require('axios');
const { Buffer } = require('buffer');
var FormData = require('form-data');

function client(key, host, domain, limit) {
    return new MailgunTemplateClient(key, host, domain, limit);
}


class MailgunTemplatesClient {

    #baseUrl = `https://%HOST%/v3/%DOMAIN%/templates`;

    #key = "";
    #host = "";
    #domain = "";
    #limit = "";

    constructor(key, host, domain, limit) {
        this.#key = key;
        this.#host = host;
        this.#domain = domain;
        this.#limit = limit;
    }

    #options() {
        return {
            headers: {
                "Authorization": `Basic ${Buffer.from(`api:${this.#key}`).toString('base64')}`,
            }
        };
    }

    #url(append) {
        return this.#baseUrl.replace("%HOSTS%", this.#host).replace("%DOMAIN%", this.#domain) + append;
    }

    /**
     * Check if template exists
     * @param {*} template 
     */
    async exists(template) {
        await axios.get(this.#url("/" + template.name), this.#options());
    }

    async create(template) {
        var params = new FormData();
        params.append('name', template.name);
        params.append('description', template.name);

        await axios.post(this.#url(""), params, this.#options());
    }

    /**
     * Create a new template if not exists
     * @param {*} template 
     */
    async createIfNotExists(template) {
        try {
            var exists = await this.exists(template);
            console.log(`Template ${exists.data.template.name} exists.`);
        }catch(err) {
            // create if not exists
            console.log(`Template ${template.name} doesnt exists (error code: ${err.response.status}). Try to create...`);
    
            await this.create(template);

            console.log(`Template ${template.name} created!`);
        }
    }

    /**
     * Clean old version of template
     * @param {*} template 
     */
    async cleanVersions(template) {
        try {
            var url = this.#url("/" + template.name + "/versions");
            var tpls = await axios.get(url, this.#options());
            console.log(`Template versions got on ${url} are ${tpls.data.template.versions.length}.`);
        } catch (tplerr) {
            console.log(`Templates versions couldnt be retrieved (error code: ${tplerr.response.status}).`);
        }
    
        // first version is the newest, so take the last to delete
        // var length = tpls.data.template.versions.length;
        while(tpls.data.template.versions.length > this.#limit){
            try {
                var version = tpls.data.template.versions.pop();
                console.log(`Start to delete version ${version.tag} (${tpls.data.template.versions.length}) with date ${version.createdAt}.`)
                var deleteUrl = this.#url("/" + template.name + "/versions" + '/' + version.tag);
                var deleted = await  axios.delete(deleteUrl, this.#options());
                console.log(`Template ${deleted.data.template.name} version ${deleted.data.template.version.tag} deleted.`);
            } catch (delerr) {
                console.log(`Template ${template.name} version ${version.tag} didnt deleted  with url <${deleteUrl}>(error code: ${delerr.response.status}). Trying to delete...`);
            }
        }
    }

    async createVersionAndActivate(template) {
        var params = new FormData();
        params.append('tag', template.uuid);
        params.append('template', template.content);
        params.append('engine', 'handlebars');
        params.append('active', 'yes');
        params.append('comment', template.comment);
    
        return await axios.post(this.#url("/" + template.name + "/versions"), params, this.#options());
    }
    
}

module.exports.client = client;