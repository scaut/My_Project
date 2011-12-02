var express = require('express');
var app = express.createServer();
app.use(express.static(__dirname + '/public'));
app.listen(80);

var nowjs = require("now");
var everyone = nowjs.initialize(app);

everyone.now.globalInfo = {
    'ConnectCount' : 0
};

everyone.connected(function () {
	everyone.now.globalInfo.ConnectCount++;
	everyone.now.totalConnentCount();
});

everyone.disconnected(function () {
	if ( everyone.now.globalInfo.ConnectCount > 0 ){
		everyone.now.globalInfo.ConnectCount--;
	}
	everyone.now.totalConnentCount();
	leaveRoom(null, this.now.serverRoom, this.now, this.user);
});

everyone.now.totalConnentCount = function() {
	everyone.now.receiveTotalConnectCount(everyone.now.globalInfo.ConnectCount);
} 

everyone.now.serverRoomsList = {'room1':'활기찬방','room2':'행복한방','room3':'꿈이있는방'};

everyone.now.distributeMessage = function(message){
    var group = nowjs.getGroup(this.now.serverRoom);
	group.now.receiveMemberIdle(this.user.clientId);
    group.now.receiveMessage(this.now.name, this.user.clientId, message);
};

everyone.now.distributeActive = function(){
    var group = nowjs.getGroup(this.now.serverRoom);
    group.now.receiveMemberActive(this.user.clientId);
};

everyone.now.distributeIdle = function(){
    var group = nowjs.getGroup(this.now.serverRoom);
    group.now.receiveMemberIdle(this.user.clientId);
};

everyone.now.changeRoom = function(newRoom){
    var oldRoom = this.now.serverRoom;
    if(oldRoom){
		leaveRoom(newRoom, oldRoom, this.now, this.user);
    }
    var newGroup = nowjs.getGroup(newRoom);
    newGroup.addUser(this.user.clientId);
    newGroup.now.receiveMessage('SERVER@'+everyone.now.serverRoomsList[newRoom], this.user.clientId, this.now.name + ' 님이 입장했습니다.');
	newGroup.now.receiveMemberList(convertType(newGroup));
    this.now.serverRoom = newRoom;
};

function leaveRoom(newRoom, oldRoom, now, user) {
	var oldGroup = nowjs.getGroup(oldRoom);
	oldGroup.removeUser(user.clientId);
	var message = now.name + ' 님이 ';
	if(newRoom){
		message += everyone.now.serverRoomsList[newRoom] + ' 으로 이동했습니다.';
	} else {
		message += '퇴장했습니다.'
	}
	oldGroup.now.receiveMessage('SERVER@'+everyone.now.serverRoomsList[oldRoom], user.clientId, message);
	oldGroup.now.receiveMemberList(convertType(oldGroup));
}

function convertType(currentGroup) {
	var memberList = "{";
	var cnt = 0;
	for (var i in currentGroup.users) {
		cnt++;
		user = currentGroup.users[i];
		memberList += "\"" + user.socket.id + "\":\"" + user.now.name + "\",";
	}
	memberList = memberList.substring(0, memberList.lastIndexOf(","));
	memberList += "}";
	if ( cnt > 0 ){
		return JSON.parse(memberList);
	} else {
		return null;
	}
}