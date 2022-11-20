# Mailgun templates updater GitHub action

Create a new version for a Mailgun email template using the content of an HTML file, and set it as the active version.

## Usage

### Inputs

| Property            |  Description                                                          | Required    |   Example    |
|---------------------|-----------------------------------------------------------------------|-------------|--------------|
| `mailgun-api-key`   | Primary account API key.  [Help](https://help.mailgun.com/hc/en-us/articles/203380100-Where-Can-I-Find-My-API-Key-and-SMTP-Credentials-) | Yes |  |
| `mailgun-api-host`  | Mailgun API Host | No | api.mailgun.net |
| `mailgun-domain-name` | Domain Name the template is registered under | Yes | mail.mydomain.com |
| `mailgun-template-versions-limit` | Number of versions you want to keep in the template. | No | 6 |
| `templates-directory` | Path where HTML templates are saved | Yes | src/templates |
| `layout`             | HTML Layout. The content of the templates will be replaced in the `%CONTENT%` string of the layout. | No | src/layout.html |


