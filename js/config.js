// Google API Client ID and API key from the Developer Console
var CLIENT_ID = '************';
var API_KEY = '************';

//Calendar IDs
var PERSONAL_CALENDER_ID = "************";
var SITE_CALENDER_ID = "************";

//Writers
//nameはライター名、aliasesはカレンダーを検索するときの表記ゆれ、isScheduledは締切の決め方
var WRITERS = [
  {name: "石川 大樹", aliases:["石川","いしかわ","イシカワ"], isScheduled: true},
  {name: "************", aliases:["************"], isScheduled: true},
  {name: "************", aliases:["************"], isScheduled: true},
  {name: "************", aliases:["************"], isScheduled: true},
]

var STATUS_ARRAY = [
  {label:'未入稿', class:'text-danger'},
  {label:'チェック中', class:'text-warning'},
  {label:'リライト待ち', class:'text-primary'},
  {label:'入稿済み', class:'text-success'},
  {label:'-管理しない', class:'text-muted'},
]