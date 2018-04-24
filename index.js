'use strict';
const {google} = require('googleapis');
const privatekey = require('./privatekey.json');
const CalendarId = 'junji.takahashi@uhuru.jp';
const async = require('async');

require('date-utils');

// 今日のイベントのみ取得用の変数
let today = new Date().clearTime().toJSON();
let tomorrow = new Date().add({days:1}).clearTime().toJSON();
//DELETE console.log('today:' + today);
//DELETE console.log('tomorrow:' + tomorrow);

exports.handler = (event, context, callback) => {

  Promise.resolve()
  .then(function(){
    return new Promise(function(resolve, reject){
      //JWT auth clientの設定
      const jwtClient = new google.auth.JWT(
             privatekey.client_email,
             null,
             privatekey.private_key,
             ['https://www.googleapis.com/auth/calendar']);
      //authenticate request
      jwtClient.authorize(function (err, tokens) {
        if (err) {
          reject(err);
        } else {
          console.log("認証成功");
          resolve(jwtClient);
        }
      });
    })
  })
  .then(function(jwtClient){
    return new Promise(function(resolve,reject){
      const calendar = google.calendar('v3');
      // 今日の予定一覧取得
      calendar.events.list({
          calendarId: CalendarId,
          auth: jwtClient,
          timeMax: tomorrow,
          timeMin: today,
          singleEvents: true,
          orderBy: 'startTime',
      }, function (err, response) {
         if (err) {
             reject(err);
         }else{
           resolve(response.data.items);
           let reservation = null;
           reservation = GetFirstReservation(response.data.items);
           if (reservation != null) {
             console.log('予約取得成功');
             console.log(reservation);
           }
         }
      });
      
    });
  })
  .then(function(result){
    callback(null, result);
  })
  .catch(function(err){
    callback(err);
  });

};

/**
 * 直近の予定を1件取得
 * @param {Object} items 今日の予定一覧
 */
function GetFirstReservation(items) {
  let reservation = null;
  //DELETE console.log('GetFirstReservation');
  //DELETE var date = new Date('2018-04-20T15:30:00+09:00').getTime();
  //DELETE console.log(date);
  const now = new Date().getTime();
  //DELETE console.log(now);
  async.each(items, function (value, callback) {
    console.log(value.summary);
    const start = new Date(value.start.dateTime).getTime();
    const end = new Date(value.end.dateTime).getTime();
    //DELETE console.log('start:'+ start);
    //DELETE console.log('end:'+ end);
    if (start < now && end > now) {
      reservation = value;
      //console.log('現在の予定');
    } else if (reservation == null && start > now) {
      reservation = value;
      //console.log('次の予定');
    }
    //TODO 予定が重なっている場合の考慮
  });
  //TODO 予定が取得できたらループを抜ける
  console.log('ループ抜ける');
  return reservation;
}