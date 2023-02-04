/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use strict";
var Faker = require("faker");
module.exports = {
  // eslint-disable-next-line no-use-before-define
  generateRandomPayload,
};
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function generateRandomPayload(userContext, events, done) {
  var payload = {
    Data: "hasbeenremoved",
    Email: "email",
  };
  payload.Email = Faker.internet.exampleEmail();
  userContext.vars.payload = payload;
  return done();
}
