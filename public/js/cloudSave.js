// Saves a student's robot, world and blocks to netlify/functions/state.js
// and restores them when GEARS opens with a ?token= in the URL.
var cloudSave = new function() {
  var self = this;
  var ENDPOINT = '/.netlify/functions/state';

  this.getToken = function() {
    return new URLSearchParams(window.location.search).get('token') || '';
  };

  // The world builder's custom layout is kept separately, so it survives
  // switching to another world.
  this.findCustomWorld = function() {
    return worlds.find(function(w) { return w.name == 'custom'; });
  };

  this.collect = function() {
    return {
      version: 1,
      blocks: blockly.getXmlText(),
      robot: robot.options,
      world: babylon.world ? {worldName: babylon.world.name, options: babylon.world.options} : null,
      customWorld: self.findCustomWorld() ? self.findCustomWorld().options : null,
      savedAt: new Date().toISOString()
    };
  };

  this.save = async function() {
    let token = self.getToken();
    if (token == '') {
      window.alert('Open GEARS from your course to save your progress.');
      return;
    }

    let response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
        body: JSON.stringify(self.collect())
      });
    } catch (err) {
      window.alert('Could not reach the server. Try again.');
      return;
    }
    window.alert(response.ok ? 'Saved.' : 'Save failed (' + response.status + ').');
  };

  this.restore = async function() {
    let token = self.getToken();
    if (token == '') {
      return;
    }

    let response;
    try {
      response = await fetch(ENDPOINT, {headers: {'Authorization': 'Bearer ' + token}});
    } catch (err) {
      return;
    }
    if (!response.ok) {
      return;
    }

    let state = await response.json();
    if (state.customWorld) {
      let custom = self.findCustomWorld();
      if (custom) {
        custom.options = state.customWorld;
        if (typeof custom.setOptions == 'function') {
          custom.setOptions(state.customWorld);
        }
      }
    }
    if (state.blocks) {
      blockly.loadXmlText(state.blocks);
    }
    if (state.robot) {
      main.loadRobot(JSON.stringify(state.robot));
    }
    if (state.world) {
      simPanel.loadWorld(JSON.stringify(state.world));
    }
  };
};

window.addEventListener('load', function() {
  cloudSave.restore();
});
