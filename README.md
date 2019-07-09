# YouTube Ads Rewind Backend
[![dep](https://img.shields.io/david/VChet/Youtube-Ads-Rewind-server.svg)](https://david-dm.org/VChet/Youtube-Ads-Rewind-server)
[![pr](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

Backend for 'YouTube Ads Rewind' userscript. More information in the [userscript repo](https://github.com/VChet/Youtube-Ads-Rewind).

## Usage
1. Install [Git command line client](https://git-scm.com/downloads).
1. Install [Node.js](https://nodejs.org/).
1. [Fork](https://github.com/AlchemyGame/alchemy/fork) this repository into your account.
1. Clone forked repository.
1. Install all dependencies `npm install`.
1. Install [mongoDB](https://www.mongodb.com/download-center/community).
1. Start database `mongod`.
1. Enter your YouTube API Key in `config.js` file 
    ```json
    youtube: {
      key: "YOUR_KEY"
    }
    ```
1. Start server `node server.js`.
1. Now the server is ready to process your [requests](api.md).
