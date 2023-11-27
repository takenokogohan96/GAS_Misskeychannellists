function run(){

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const channelsheet = spreadsheet.getSheetByName('list');
  const channelsheet_row = 2
  const rawsheet = spreadsheet.getSheetByName('raw');
  const rawsheet_row = 5
  const instance = "misskey.io"
  var channellist = []
  var addchannellist = []
  var fetchcount = 0;

  //一番最新のチャンネルを取得する
  channellist = fetch(instance,false,++fetchcount)
  addchannellist = channellist
  
  //次のチャンネルを取得して配列に追加（結合）する
  while(addchannellist.length != 0){
    addchannellist = fetch(instance,true,addchannellist[addchannellist.length - 1].id,++fetchcount)
    Array.prototype.push.apply(channellist,addchannellist)
  }
  console.log("[1/6] fetch完了（fetch回数："+ fetchcount +"）")
  
  //シート初期化部
  rawsheet.getRange(rawsheet_row, 1, rawsheet.getMaxRows(),rawsheet.getLastColumn()).clearContent();
  channelsheet.getRange(channelsheet_row, 1, channelsheet.getMaxRows(),channelsheet.getLastColumn()).clearContent();
  channelsheet.getRange(channelsheet_row, 1, channelsheet.getMaxRows(),channelsheet.getLastColumn()).setBackground(null);
  channelsheet.getRange(channelsheet_row, 1, channelsheet.getMaxRows(),channelsheet.getLastColumn()).setBorder(false,false,false,false,false,false)
  console.log("[2/6] シート初期化完了")

  //raw書き込み部
  const rawarrays = objectsToArrays(channellist);
  rawsheet.getRange(rawsheet_row, 1, rawarrays.length, rawarrays[0].length).setValues(rawarrays);
  console.log("[3/6] raw書き込み完了")

  //list更新中表示
  channelsheet.getRange(1,1).setValue("list更新中です。5分程度時間をおいて再度アクセスしてください\nこの表示が出続ける場合は次の自動更新をお待ちください")

  //list書き込み部
  raw_description_range = rawsheet.getRange(rawsheet_row+1,5,rawsheet.getMaxRows(),1)
  raw_userCount_range = rawsheet.getRange(rawsheet_row+1,11,rawsheet.getMaxRows(),1) 
  raw_notesCount_range = rawsheet.getRange(rawsheet_row+1,12,rawsheet.getMaxRows(),1)
  raw_description_range.copyTo(channelsheet.getRange(channelsheet_row, 3),SpreadsheetApp.CopyPasteType.PASTE_VALUES)
  raw_userCount_range.copyTo(channelsheet.getRange(channelsheet_row, 4),SpreadsheetApp.CopyPasteType.PASTE_VALUES)
  raw_notesCount_range.copyTo(channelsheet.getRange(channelsheet_row, 5),SpreadsheetApp.CopyPasteType.PASTE_VALUES)
  console.log("カーボンコピー完了")
  
  for(i = 0;i < channellist.length;i++){

    channelsheet.getRange(i+channelsheet_row, 1).setBackground(channellist[i].color) // color
    
    channellink = "https://" + instance + "" + "/channels/" + channellist[i].id
    channelname = channellist[i].name.replace(/"/g, '""');
    link = `=HYPERLINK("${channellink}", "${channelname}")`;
    channelsheet.getRange(i+channelsheet_row, 2).setFormula(link) // 名前,リンク

    if(channellist[i].lastNotedAt == null){
      channelsheet.getRange(i+channelsheet_row, 6).setValue("-")//更新がない
    }else{
      let lastnote = new Date(channellist[i].lastNotedAt)
      let today = new Date();
      if(today - lastnote < 86400000){
        channelsheet.getRange(i+channelsheet_row, 6).setValue("つい最近")//更新日
      }else{
        channelsheet.getRange(i+channelsheet_row, 6).setValue(Math.floor((today - lastnote) / 86400000) + "日前")//更新日
      }
    }

    if(channellist[i].isSensitive){// センシティブフラグ
      channelsheet.getRange(i+channelsheet_row, 7).setBackground("red").setFontColor("white").setValue("Yes") 
    }else{
      channelsheet.getRange(i+channelsheet_row, 7).setValue("No")
    }

    if((i+1)%500 == 0){
      console.log("書き込み数：" + channellist.length + "件中" + (i + 1) + "件")
    }
  }
  console.log("[4/6] list書き込み完了")
  
  //罫線
  channelsheet.getRange(channelsheet_row, 1, channelsheet.getLastRow()-1,channelsheet.getLastColumn()).setBorder(true,true,true,true,true,true)//罫線設置
  channelsheet.getRange(channelsheet_row, 2, channelsheet.getLastRow()-1,1).setFontSize(12) //チャンネル名フォントサイズ調整
  channelsheet.getRange(channelsheet_row, 2, channelsheet.getLastRow()-1,1).setFontLine("none") //チャンネル名アンダーライン削除
  channelsheet.getRange(channelsheet_row, 2, channelsheet.getLastRow()-1,1).setFontWeight("bold") //チャンネル名太字
  console.log("[5/6] 書式設定完了")

  //更新履歴欄
  var date = new Date();
  channelsheet.getRange(1,1).setValue("【チャンネル数】" + channellist.length +"　【リスト更新日時】" + Utilities.formatDate( date, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm'))
  console.log("[6/6] 更新履歴欄書き込み完了")

}

function fetch(instance,isuntilId,untilId,fetchcount) {

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

  Utilities.sleep(500); //

  try{
    response = UrlFetchApp.fetch(url, param);
  }catch(e){
    console.log("Fetch再試行(" + e.message + ")\nfetchcount = " + fetchcount)
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