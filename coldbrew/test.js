var ActionRecord = require('./action_record');

var k = new ActionRecord();
k.build(1,1,3);

var n = ActionRecord.FromBytes(k.serialize());
console.log("Action: " + n.action);
console.log("DX: " + n.dx);
console.log("DY: " + n.dy);