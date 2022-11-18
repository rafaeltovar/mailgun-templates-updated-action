const fs = require('fs');
const path = require('path');
const parseComments = require('parse-html-comments')

function parse(htmlpath, uuid, layout) {
    return new Template(htmlpath, uuid, layout);
}


class Template {

    // options = {
    //     name: "",
    //     description: "",
    //     comment: "",
    //     layout: {
    //         file: "",
    //         replace: "%CONTENT%"
    //     }
    // }

    // version comment
    comment = "New version of the template.";

    // template name
    name = "";

    // tag
    uuid = "";

    #layoutpath = "";
    #content = "";

    constructor(htmlpath, uuid, layout) {
        this.uuid = uuid;
        this.#layoutpath = layout;

        this.#content = fs.readFileSync(htmlpath, { encoding: 'utf-8' });

        this.comment = this.#htmlCommentParser(this.#content);

        var comments = parseComments(this.#content);
        var firstComment = comments.matches.length > 0? comments.matches[0] : null;
        
        // // process comment to options
        // if(null !==firstComment) {
        //     var options = this.#convertHtmlCommentToJson(firstComment.groups.commentOnly);

        //     if(null !== options) {
        //         this.#content = this.#content.replace(firstComment.groups.commentOnly, "");

        //         this.options = {...this.options, ...options};
        //     }
        // }

        this.name = path.parse(htmlpath).name.replace(" ", "-");
    }

    get content() {
        if(this.#hasLayout()) {
            try {
                var layout = fs.readFileSync(this.#layoutpath, { encoding: 'utf-8' });
                return layout.replace("%CONTENT%", this.#content);
            } catch(e) {
                console.error(`Layout ${this.#layoutpath} doesn't exists or nor readable.`);
            }
        }

        return this.#content;
    }

    // private methods below
    #hasLayout() {
        return "" !== this.#layoutpath;
    }

    /**
     * 
     * @param {*} html 
     * @returns string
     */
    #htmlCommentParser(html) {
        var comments = parseComments(html);
        var firstComment = comments.matches.length > 0? comments.matches[0] : null;
        
        var string = "";
        // process comment
        if(null !==firstComment && firstComment.groups.commentOnly.indexOf("comment:") !== -1) {
            var string = firstComment.groups.commentOnly.replace("<!--", "").replace("-->", "").replace(/(^\s*(?!.+)\n+)|(\n+\s+(?!.+)$)/g, "").trim().replace("comment:", "");
            // remove comment of content
            this.#content = this.#content.replace(firstComment.groups.commentOnly, "");
        }

        return string;
    }

    // #convertHtmlCommentToJson(comment) {
    //     var string = comment.replace("<!--", "").replace("-->", "").replace(/(^\s*(?!.+)\n+)|(\n+\s+(?!.+)$)/g, "").trim();
    //     try {
    //         var json = JSON.parse(string);
    //     } catch(e) {
    //         console.error("Not is valid json");
    //         return null;
    //     }

    //     return json;
    // }

}

module.exports.parse = parse;