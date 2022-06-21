import { config } from 'src/config';
import { logMessage } from 'src/utils';
import { server } from 'test/mocks/xhr.js';
import {
  onePlusXSubmodule,
  buildOrtb2Object,
  setBidderConfig,
  setTargetingDataToConfig
} from 'modules/1plusXRtdProvider';

describe('1plusXRtdProvider', () => {
  const reqBidsConfigObj = {};
  let fakeServer;
  const fakeResponseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
  const fakeResponse = {
    s: ['segment1', 'segment2', 'segment3'],
    t: ['targeting1', 'targeting2', 'targeting3']
  };

  before(() => {
    config.resetConfig();
  })

  after(() => { })

  beforeEach(() => {
    fakeServer = sinon.createFakeServer();
    fakeServer.respondWith('GET', '*', [200, fakeResponseHeaders, JSON.stringify(fakeResponse)]);
    fakeServer.respondImmediately = true;
    fakeServer.autoRespond = true;
  })

  describe('onePlusXSubmodule', () => {
    it('init is successfull', () => {
      const initResult = onePlusXSubmodule.init();
      expect(initResult).to.be.true;
    })

    it('callback is called after getBidRequestData', () => {
      // Nice case; everything runs as expected
      {
        const callbackSpy = sinon.spy();
        const config = { params: { customerId: 'test' } };
        onePlusXSubmodule.getBidRequestData(reqBidsConfigObj, callbackSpy, config);
        setTimeout(() => {
          expect(callbackSpy.calledOnce).to.be.true
        }, 100)
      }
      // No customer id in config => error but still callback called
      {
        const callbackSpy = sinon.spy();
        const config = {}
        onePlusXSubmodule.getBidRequestData(reqBidsConfigObj, callbackSpy, config);
        setTimeout(() => {
          expect(callbackSpy.calledOnce).to.be.true
        }, 100);
      }
    })
  })

  describe('buildOrtb2Object', () => {
    it('fills site.keywords & user.keywords in the ortb2 config', () => {
      const rtdData = { segments: fakeResponse.s, topics: fakeResponse.t };
      const ortb2Object = buildOrtb2Object(rtdData);

      const expectedOutput = {
        site: {
          keywords: {
            opeaud: rtdData.segments,
            opectx: rtdData.topics,
          }
        },
        user: {
          keywords: {
            opeaud: rtdData.segments,
            opectx: rtdData.topics,
          }
        }
      }
      expect([ortb2Object]).to.deep.include.members([expectedOutput]);
    });

    it('defaults to empty array if no segment is given', () => {
      const rtdData = { topics: fakeResponse.t };
      const ortb2Object = buildOrtb2Object(rtdData);

      const expectedOutput = {
        site: {
          keywords: {
            opeaud: [],
            opectx: rtdData.topics
          }
        },
        user: {
          keywords: {
            opeaud: [],
            opectx: rtdData.topics
          }
        }
      }

      expect(ortb2Object).to.deep.include(expectedOutput);
    })

    it('defaults to empty array if no topic is given', () => {
      const rtdData = { segments: fakeResponse.s };
      const ortb2Object = buildOrtb2Object(rtdData);

      const expectedOutput = {
        site: {
          keywords: {
            opeaud: rtdData.segments,
            opectx: []
          }
        },
        user: {
          keywords: {
            opeaud: rtdData.segments,
            opectx: []
          }
        }
      }

      expect(ortb2Object).to.deep.include(expectedOutput);
    })
  })


})
