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


  describe('setBidderConfig', () => {
    const ortb2Object = {
      site: {
        keywords: {
          opeaud: fakeResponse.s,
          opectx: fakeResponse.t,
        }
      },
      user: {
        keywords: {
          opeaud: fakeResponse.s,
          opectx: fakeResponse.t,
        }
      }
    }

    const bidderConfigInitial = {
      ortb2: {
        user: { data: [] },
        site: { content: { data: [] } }
      }
    }

    it("doesn't write in config of unsupported bidder", () => {
      const unsupportedBidder = Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 5);
      // Set initial config for this bidder 
      config.setBidderConfig({
        bidders: [unsupportedBidder],
        config: bidderConfigInitial
      })
      // Call my own setBidderConfig with targeting data 
      setBidderConfig(unsupportedBidder, ortb2Object, config.getBidderConfig());
      // Check that the config has not been changed for unsupported bidder
      const newConfig = config.getBidderConfig()[unsupportedBidder];
      expect(newConfig.ortb2.user).to.not.have.any.keys('keywords')
      expect(newConfig.ortb2.site).to.not.have.any.keys('keywords')
      expect(newConfig).to.deep.include(bidderConfigInitial);
    })

    it('merges config for supported bidders', () => {
      const bidder = 'appnexus';
      // Set initial config
      config.setBidderConfig({
        bidders: [bidder],
        config: bidderConfigInitial
      });
      // Call submodule's setBidderConfig
      setBidderConfig(bidder, ortb2Object, config.getBidderConfig());
      // Check that the targeting data has been set in the config
      const newConfig = config.getBidderConfig()[bidder];
      expect(newConfig.ortb2.site).to.deep.include(ortb2Object.site);
      expect(newConfig.ortb2.user).to.deep.include(ortb2Object.user);
      // Check that existing config didn't get erased 
      expect(newConfig.ortb2.site).to.deep.include(bidderConfigInitial.ortb2.site);
      expect(newConfig.ortb2.user).to.deep.include(bidderConfigInitial.ortb2.user);
    })
  })

})
