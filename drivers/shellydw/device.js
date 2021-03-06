'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class ShellydwDevice extends Homey.Device {

  onInit() {
    new Homey.FlowCardTriggerDevice('triggerCallbackEvents').register();

    this.pollDevice();
    this.setAvailable();

    // ADD MISSING CAPABILITIES
    if (!this.hasCapability('button.callbackevents')) {
      this.addCapability('button.callbackevents');
    }
    if (!this.hasCapability('button.removecallbackevents')) {
      this.addCapability('button.removecallbackevents');
    }

    this.registerCapabilityListener('button.callbackevents', async () => {
      var homeyip = await util.getHomeyIp();
      var dark_url = '/settings?dark_url=http://'+ homeyip +'/api/app/cloud.shelly/button_actions/shellydw/'+ this.getData().id +'/open_dark/';
      var twilight_url = '/settings?twilight_url=http://'+ homeyip +'/api/app/cloud.shelly/button_actions/shellydw/'+ this.getData().id +'/open_twilight/';
      var close_url = '/settings?close_url=http://'+ homeyip +'/api/app/cloud.shelly/button_actions/shellydw/'+ this.getData().id +'/close/';
      var vibration_url = '/settings?vibration_url=http://'+ homeyip +'/api/app/cloud.shelly/button_actions/shellydw/'+ this.getData().id +'/vibration/';

      try {
        await util.sendCommand(dark_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(twilight_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(close_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(vibration_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand('/reboot', this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        return;
      } catch (error) {
        throw new Error(error);
      }
    });

    this.registerCapabilityListener('button.removecallbackevents', async () => {
      var dark_url = '/settings?dark_url=null';
      var twilight_url = '/settings?twilight_url=null';
      var close_url = '/settings?close_url=null';
      var vibration_url = '/settings?vibration_url=null';

      try {
        await util.sendCommand(dark_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(twilight_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(close_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(vibration_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        return;
      } catch (error) {
        throw new Error(error);
      }
    });
  }

  onDeleted() {
    clearInterval(this.pollingInterval);
  }

  // HELPER FUNCTIONS
  pollDevice() {
    clearInterval(this.pollingInterval);

    this.pollingInterval = setInterval(() => {
      util.sendCommand('/status', this.getSetting('address'), this.getSetting('username'), this.getSetting('password'))
        .then(result => {
          let alarm = false;
          let state = result.sensor.state;
          let lux = result.lux.value;
          let battery = result.bat.value;
          let voltage = result.bat.voltage;

          if (state == 'open') {
            alarm = true;
          } else {
            alarm = false;
          }

          // capability alarm_contact
          if (alarm != this.getCapabilityValue('alarm_contact')) {
            this.setCapabilityValue('alarm_contact', alarm);
          }

          // capability measure_luminance
          if (lux != this.getCapabilityValue('measure_luminance')) {
            this.setCapabilityValue('measure_luminance', lux);
          }

          // capability measure_power
          if (battery != this.getCapabilityValue('measure_battery')) {
            this.setCapabilityValue('measure_battery', battery);
          }

          // capability measure_voltage
          if (voltage != this.getCapabilityValue('measure_voltage')) {
            this.setCapabilityValue('measure_voltage', voltage);
          }

        })
        .catch(error => {
          this.log('Device asleep or disconnected');
        })
    }, 4000);
  }

  triggerCallbackEvents(action) {
    return Homey.ManagerFlow.getCard('trigger', "triggerCallbackEvents").trigger(this, {"action": action}, {})
  }

}

module.exports = ShellydwDevice;
