"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');
var added_devices = {};
var temp_devices = {};

class ShellyRGBW2WhiteDriver extends Homey.Driver {

  onInit() {
    this.loadDevices();
    this.pollDevices();
  }

  onPair(socket) {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();
    let selectedDeviceId;
    let deviceArray = {};

    socket.on('list_devices', (data, callback) => {
      const devices = Object.values(discoveryResults).map(discoveryResult => {
        return {
          name: 'Shelly RGBW2 White ['+ discoveryResult.address +']',
          data: {
            id: discoveryResult.id,
          }
        };
      });
      if (devices.length) {
        callback(null, devices);
      } else {
        socket.showView('select_pairing');
      }
    });

    socket.on('list_devices_selection', (data, callback) => {
      callback();
      selectedDeviceId = data[0].data.id;
    });

    socket.on('get_device', (data, callback) => {
      const discoveryResult = discoveryResults[selectedDeviceId];
      if(!discoveryResult) return callback(new Error('Something went wrong'));

      util.sendCommand('/shelly', discoveryResult.address, '', '')
        .then(result => {
          deviceArray = {
            name: 'Shelly RGBW2 White ['+ discoveryResult.address +']',
            data: {
              id: discoveryResult.id,
            },
            settings: {
              address  : discoveryResult.address,
              username : '',
              password : ''
            },
            store: {
              type: result.type
            }
          }
          if (result.auth) {
            socket.showView('login_credentials');
          } else {
            socket.showView('add_device');
          }
        })
        .catch(error => {
          callback(error, false);
        })
    });

    socket.on('login', (data, callback) => {
      deviceArray.settings.username = data.username;
      deviceArray.settings.password = data.password;
      callback(null, true);
    });

    socket.on('add_device', (data, callback) => {
      this.loadDevices();
      this.pollDevices();
      callback(false, deviceArray);
    });

    socket.on('manual_pairing', function(data, callback) {
      util.sendCommand('/settings', data.address, data.username, data.password)
        .then(result => {
          var hostname = result.device.hostname;
          if (hostname.startsWith('shellyrgbw2-')) {
            deviceArray = {
              name: 'Shelly RGBW2 White ['+ data.address +']',
              data: {
                id: result.device.hostname,
              },
              settings: {
                address  : data.address,
                username : data.username,
                password : data.password
              },
              store: {
                type: result.device.type
              }
            }
            callback(null, result);
          } else {
            callback(null, 'incorrect device');
          }
        })
        .catch(error => {
          callback(error, null);
        })
    });

  }

  // HELPER FUNCTIONS
  loadDevices() {
    added_devices = Homey.ManagerDrivers.getDriver('shellyrgbw2white').getDevices();
    this.updateDevices();
    return true;
  }

  pollDevices() {
    clearInterval(this.pollingInterval);

    this.pollingInterval = setInterval(() => {

      try {
        if (added_devices.length > 0) {
          Object.keys(added_devices).forEach((key) => {

            if (added_devices[key].getStoreValue("channel") == 0) {
              var device0_id = added_devices[key].getData().id
              var device1_id = added_devices[key].getStoreValue('main_device') + "-channel-1";
              var device2_id = added_devices[key].getStoreValue('main_device') + "-channel-2";
              var device3_id = added_devices[key].getStoreValue('main_device') + "-channel-3";

              util.sendCommand('/status', added_devices[key].getSetting('address'), added_devices[key].getSetting('username'), added_devices[key].getSetting('password'))
                .then(result => {
                  clearTimeout(this.offlineTimeout);

                  var dim0 = result.lights[0].brightness > 100 ? 1 : result.lights[0].brightness / 100;
                  var dim1 = result.lights[1].brightness > 100 ? 1 : result.lights[1].brightness / 100;
                  var dim2 = result.lights[2].brightness > 100 ? 1 : result.lights[2].brightness / 100;
                  var dim3 = result.lights[3].brightness > 100 ? 1 : result.lights[3].brightness / 100;

                  temp_devices[device0_id] = {
                    id: device0_id,
                    onoff: result.lights[0].ison,
                    dim: dim0,
                    measure_power: result.meters[0].power,
                    online: true
                  }

                  temp_devices[device1_id] = {
                    id: device1_id,
                    onoff: result.lights[1].ison,
                    dim: dim1,
                    measure_power: result.meters[1].power,
                    online: true
                  }

                  temp_devices[device2_id] = {
                    id: device1_id,
                    onoff: result.lights[2].ison,
                    dim: dim2,
                    measure_power: result.meters[2].power,
                    online: true
                  }

                  temp_devices[device3_id] = {
                    id: device1_id,
                    onoff: result.lights[3].ison,
                    dim: dim3,
                    measure_power: result.meters[3].power,
                    online: true
                  }
                })
                .catch(error => {
                  this.log(error);
                  if (temp_devices.length > 0) {
                    if (temp_devices[device0_id].online == true) {
                      temp_devices[device0_id].online = false;
                    }
                    if (temp_devices[device1_id].online == true) {
                      temp_devices[device1_id].online = false;
                    }
                    if (temp_devices[device2_id].online == true) {
                      temp_devices[device2_id].online = false;
                    }
                    if (temp_devices[device3_id].online == true) {
                      temp_devices[device3_id].online = false;
                    }
                  }

                  this.offlineTimeout = setTimeout(() => {
                    let offlineTrigger = new Homey.FlowCardTrigger('triggerDeviceOffline');
                    offlineTrigger.register().trigger({"device": added_devices[key].getName(), "device_error": error.toString() });
                    return;
                  }, 60000 * added_devices[key].getSetting('offline'));
                })
            }

          });

        } else {
          clearInterval(this.pollingInterval);
        }

      } catch (error) {
        this.log(error);
      }
    }, 5000);
  }

  updateDevices() {
    clearInterval(this.updateInterval);
    this.updateInterval = setInterval(() => {
      try {
        if (added_devices.length > 0) {
          Object.keys(added_devices).forEach((key) => {
            if (temp_devices.hasOwnProperty(added_devices[key].getData().id)) {
              if (temp_devices[added_devices[key].getData().id].online == true) {

                if (!added_devices[key].getAvailable()) {
                  added_devices[key].setAvailable();
                }

                // capability onoff
                if (temp_devices[added_devices[key].getData().id].onoff != added_devices[key].getCapabilityValue('onoff')) {
                  added_devices[key].setCapabilityValue('onoff', temp_devices[added_devices[key].getData().id].onoff);
                }
                // capability dim
                if (temp_devices[added_devices[key].getData().id].dim != added_devices[key].getCapabilityValue('dim')) {
                  added_devices[key].setCapabilityValue('dim', temp_devices[added_devices[key].getData().id].dim);
                }
                // capability measure_power
                if (temp_devices[added_devices[key].getData().id].measure_power != added_devices[key].getCapabilityValue('measure_power')) {
                  added_devices[key].setCapabilityValue('measure_power', temp_devices[added_devices[key].getData().id].measure_power);
                }
              } else {
                added_devices[key].setUnavailable(Homey.__('Unreachable'));
              }

            }
          });
        } else {
          clearInterval(this.updateInterval);
        }
      } catch (error) {
        this.log(error);
      }

    }, 2000);
  }

  updateTempDevices(device_id, capability, state) {
    if (temp_devices.hasOwnProperty(device_id)) {
      temp_devices[device_id][capability] = state;
    }
  }

}

module.exports = ShellyRGBW2WhiteDriver;
