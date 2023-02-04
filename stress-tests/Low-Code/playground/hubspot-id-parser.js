/* eslint-disable */
function printStatus(requestParams, response, context, ee, next) {
  console.log(`${response.body}`);
  return next();
}

module.exports = {
  printStatus: printStatus,
};
