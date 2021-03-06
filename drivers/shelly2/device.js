'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class Shelly2Device extends Homey.Device {

  onInit() {
    new Homey.FlowCardTriggerDevice('triggerCallbackEvents').register();

    this.setAvailable();

    // ADD MISSING CAPABILITIES
    if (!this.hasCapability('button.callbackevents')) {
      this.addCapability('button.callbackevents');
    }
    if (!this.hasCapability('button.removecallbackevents')) {
      this.addCapability('button.removecallbackevents');
    }

    // LISTENERS FOR UPDATING CAPABILITIES
    this.registerCapabilityListener('onoff', (value, opts) => {
      Homey.ManagerDrivers.getDriver('shelly2').updateTempDevices(this.getData().id, 'onoff', value);
      if (value) {
        return util.sendCommand('/relay/'+ this.getStoreValue("channel") +'?turn=on', this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
      } else {
        return util.sendCommand('/relay/'+ this.getStoreValue("channel") +'?turn=off', this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
      }
    });

    this.registerCapabilityListener('button.callbackevents', async () => {
      var homeyip = await util.getHomeyIp();
      var btn_on_url = '/settings/relay/'+ this.getStoreValue('channel') +'?btn_on_url=http://'+ homeyip +'/api/app/cloud.shelly/button_actions/shelly2/'+ this.getData().id +'/btn_on/';
      var btn_off_url = '/settings/relay/'+ this.getStoreValue('channel') +'?btn_off_url=http://'+ homeyip +'/api/app/cloud.shelly/button_actions/shelly2/'+ this.getData().id +'/btn_off/';
      var out_on_url = '/settings/relay/'+ this.getStoreValue('channel') +'?out_on_url=http://'+ homeyip +'/api/app/cloud.shelly/button_actions/shelly2/'+ this.getData().id +'/out_on/';
      var out_off_url = '/settings/relay/'+ this.getStoreValue('channel') +'?out_off_url=http://'+ homeyip +'/api/app/cloud.shelly/button_actions/shelly2/'+ this.getData().id +'/out_off/';
      var shortpush_url = '/settings/relay/'+ this.getStoreValue('channel') +'?shortpush_url=http://'+ homeyip +'/api/app/cloud.shelly/button_actions/shelly2/'+ this.getData().id +'/shortpush/';
      var longpush_url = '/settings/relay/'+ this.getStoreValue('channel') +'?longpush_url=http://'+ homeyip +'/api/app/cloud.shelly/button_actions/shelly2/'+ this.getData().id +'/longpush/';

      try {
        await util.sendCommand(btn_on_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(btn_off_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(out_on_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(out_off_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(shortpush_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(longpush_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand('/reboot', this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        return;
      } catch (error) {
        throw new Error(error);
      }
    });

    this.registerCapabilityListener('button.removecallbackevents', async () => {
      var btn_on_url = '/settings/relay/'+ this.getStoreValue('channel') +'?btn_on_url=null';
      var btn_off_url = '/settings/relay/'+ this.getStoreValue('channel') +'?btn_off_url=null';
      var out_on_url = '/settings/relay/'+ this.getStoreValue('channel') +'?out_on_url=null';
      var out_off_url = '/settings/relay/'+ this.getStoreValue('channel') +'?out_off_url=null';
      var shortpush_url = '/settings/relay/'+ this.getStoreValue('channel') +'?shortpush_url=null';
      var longpush_url = '/settings/relay/'+ this.getStoreValue('channel') +'?longpush_url=null';

      try {
        await util.sendCommand(btn_on_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(btn_off_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(out_on_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(out_off_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(shortpush_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        await util.sendCommand(longpush_url, this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
        return;
      } catch (error) {
        throw new Error(error);
      }
    });

  }

  onDeleted() {
    return Homey.ManagerDrivers.getDriver('shelly2').loadDevices();
  }

  triggerCallbackEvents(action) {
    return Homey.ManagerFlow.getCard('trigger', "triggerCallbackEvents").trigger(this, {"action": action}, {})
  }

}

module.exports = Shelly2Device;
