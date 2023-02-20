/* eslint-disable */
function printStatus(requestParams, response, context, ee, next) {
  console.log(`${response.body}`);
  return next();
}

function trapError(requestParams, context, ee, next) {
  if (!requestParams.hooks) {
    requestParams.hooks = {};
  }
  if (!requestParams.hooks.beforeError) {
    requestParams.hooks.beforeError = [];
  }
  requestParams.hooks.beforeError.push((error) => {
    if (error.name !== "HTTPError") {
      console.error(requestParams.url, error.name);
      console.log(requestParams);
    }
    return error;
  });
  next();
}

module.exports = {
  printStatus: printStatus,
  trapError: trapError,
};
