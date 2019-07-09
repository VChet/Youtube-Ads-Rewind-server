## API
**Default URL: `http://localhost:7542`**

`GET /api/video/check`

Returns the advertising timings, if the video is in the database
#### Params
```json
  videoId
```
#### Response
// TODO

`POST api/video/report`

Sends timing to the database
#### Request body
```json
  // Video Id
  "id": String,
  // Timings in seconds where advertisement start and ends
  "timings": {
    "starts": String,
    "ends": String
  }
```
#### Response
// TODO