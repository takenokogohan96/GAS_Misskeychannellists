function run(){

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const channelsheet = spreadsheet.getSheetByName('list');
  const channelsheet_row = 2
  const rawsheet = spreadsheet.getSheetByName('raw');
  const rawsheet_row = 5
  const instance = "misskey.io"
  var channellist = []
  var addchannellist = []

  //各シート初期化
  rawsheet.getRange(rawsheet_row, 1, rawsheet.getMaxRows(),rawsheet.getLastColumn()).clearContent();
  channelsheet.getRange(channelsheet_row, 1, channelsheet.getMaxRows(),channelsheet.getLastColumn()).clearContent();
  channelsheet.getRange(channelsheet_row, 1, channelsheet.getMaxRows(),channelsheet.getLastColumn()).setBackground(null);
  channelsheet.getRange(channelsheet_row, 1, channelsheet.getMaxRows(),channelsheet.getLastColumn()).setFontColor(null);
  channelsheet.getRange(channelsheet_row, 1, channelsheet.getMaxRows(),channelsheet.getLastColumn()).setBorder(false,false,false,false,false,false)

  //一番最新のチャンネルを取得する
  channellist = fetch(instance,false)
  addchannellist = channellist

  //次のチャンネルを取得して配列に追加（結合）する
  while(addchannellist.length != 0){
    addchannellist = fetch(instance,true,addchannellist[addchannellist.length - 1].id)
    Array.prototype.push.apply(channellist,addchannellist)
  }
  console.log("[1/4] fetch完了")
  
  //raw書き込み部
  const rawarrays = objectsToArrays(channellist);
  rawsheet.getRange(rawsheet_row, 1, rawarrays.length, rawarrays[0].length).setValues(rawarrays);  
  console.log("[2/4] raw書き込み完了")

  //チャンネル数書き込み
  channelsheet.getRange(1,2).setValue("チャンネル数：" + channellist.length)
  console.log("[3/4] チャンネル数書き込み完了")

  //チャンネル一覧書き込み部
  for(i = 0;i < channellist.length;i++){

    channelsheet.getRange(i+channelsheet_row, 1).setBackground(channellist[i].color) // color
    
    channellink = "https://" + instance + "" + "/channels/" + channellist[i].id
    link = `=HYPERLINK("${channellink}", "${channellist[i].name}")`;
    channelsheet.getRange(i+channelsheet_row, 2).setFormula(link) // 名前,リンク

    channelsheet.getRange(i+channelsheet_row, 3).setValue(channellist[i].description) // 説明

    /*
    if(channellist[i].isSensitive == "TRUE"){// センシティブフラグ
      channelsheet.getRange(i+channelsheet_row, 4).setBackground("red").setFontColor("white").setValue("Yes") 
    }else{
      channelsheet.getRange(i+channelsheet_row, 4).setValue("No")
    }
    */

    channelsheet.getRange(i+channelsheet_row, 4).setValue(channellist[i].usersCount) // ユーザ数
    channelsheet.getRange(i+channelsheet_row, 5).setValue(channellist[i].notesCount) // ノート数

    channelsheet.getRange(i+channelsheet_row, 6).setValue(Utilities.formatDate(new Date(channellist[i].createdAt), "JST", "yyyy-MM-dd"))//作成日

    if((i+1)%500 == 0){
      console.log(channellist.length + "件中" + (i + 1) + "件書き込み完了")
    }
  }
  console.log("[4/4] list書き込み完了")

  //罫線
  channelsheet.getRange(channelsheet_row, 1, channelsheet.getLastRow()-1,channelsheet.getLastColumn()).setBorder(true,true,true,true,true,true)
  
}

function fetch(instance,isuntilId,untilId) {

  const url = "https://" + instance + "/api/channels/search"

  if(isuntilId == true){
    var requestbody = {
      "query": "",
      "untilId": untilId,
      "limit": 100,  
    }
  }else{
    var requestbody = {
      "query": "",
      "limit": 1,
    }
  }

  const param = {
    "method": "POST",
    "headers": { 'Content-type': "application/json" },
    "payload": JSON.stringify(requestbody)
  }

  Utilities.sleep(1000); //

  try{
    response = UrlFetchApp.fetch(url, param);
  }catch(e){
    console.log("Fetch再試行")
    response = UrlFetchApp.fetch(url, param);
  }
  
  json = JSON.parse(response.getContentText());
  return json
}

function objectsToArrays(objects) {
  const keys = Object.keys(objects[0]);
  const records = objects.map(object => 
    keys.map(key => object[key])
  );
  return [keys, ...records];
}