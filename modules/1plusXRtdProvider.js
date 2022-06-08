// Constants 
const MODULE_NAME = '1plusX'

// Functions

// Functions exported in submodule object
const init = (config, userConsent) => { }

const getBidRequestData = (reqBidsConfigObj, callback, config, userConsent) => { }

// The RTD submodule object to be exported
export const onePlusXSubmodule = {
  name: MODULE_NAME,
  init,
  getBidRequestData
}