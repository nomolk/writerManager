window.onload = initComponents();
var now = new Date();
var today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));

class GCaleadarData{
  constructor() {
  }

  get calendarList(){ return this._calendarList; }
  set calendarList(calendarList){ this._calendarList = calendarList; }
  get personalCalendar(){ return this._personalCalendar; }
  set personalCalendar(personalCalendar){ this._personalCalendar = personalCalendar; }
  get siteCalendar(){ return this._siteCalendar; }
  set siteCalendar(siteCalendar){ this._siteCalendar = siteCalendar; }

  async loadCalendar(){
    var calendarData = await Promise.all([getCalendarList(), getPersonalCalendar(), getSiteCalendar()]);
    this.calendarList = calendarData[0];
    this.personalCalendar = calendarData[1];
    this.siteCalendar = calendarData[2];
  }

  dumpHtml(){
    var html = ""
    var lists = [this.personalCalendar, this.siteCalendar];
    var listNames = ['Events from the presonal calendar', 'Events from the Site calendar'];
    for (var [index, list] of lists.entries()){
      if (list.length > 0) {
        html += ('*' + listNames[index] + '<br />');
        for (var event of list) {
          html += (event.start.date + " / " + event.summary + ' (' + event.id + ') ' + event.description + '<br />');
        }
      } else {
        html += ('No events found.<br />');
      }
      html += ('<br />');
    };
    
    if (this.calendarList.length > 0) {
      html += ('*The list of calendars<br />');
      for (var calendar of this.calendarList) {
        html += (calendar.summary + ' (' + calendar.id + ')<br />');
      }
    } else {
      html += ('No calendars found.<br />');
    }
    html += ('<br />');
    return html;
  }
  
  getArticlesOfTheDay(date){
    return this.extractEventsOfTheDay(this.siteCalendar, date);
  }

  getSchedulesOfTheDay(date){
    return this.extractEventsOfTheDay(this.personalCalendar, date);
  }

  extractEventsOfTheDay(calendar, date){
    var events = [];
    var dateWithoutTime = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
    for(var event of calendar){
      var eventDate = new Date(event.start.date ? event.start.date : event.start.dateTime);
      var eventDateWithoutTime = new Date(Date.UTC(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 0, 0, 0));
      if(eventDateWithoutTime.getTime() == dateWithoutTime.getTime()){
        events.push(event);
      }
    }
    return events;
  }
}

class Writer{
  constructor(index, name, aliases, isScheduled){
    this.index = index;
    this.name = name;
    this.aliases = aliases;
    this.isScheduled = isScheduled;
  }
  get index(){ return this._index; }
  set index(index){ this._index = index; }
  get name(){ return this._name; }
  set name(name){ this._name = name; }
  get aliases(){ return this._aliases; }
  set aliases(aliases){ this._aliases = aliases; }
  get isScheduled(){ return this._isScheduled; }
  set isScheduled(isScheduled){ this._isScheduled = isScheduled; }
}

async function initView(events){
  calendarData = new GCaleadarData();
  await calendarData.loadCalendar();
  rawData.appendHtml();
  writers = [];
  for(var [index, item] of WRITERS.entries()){
    item.aliases.push(item.name);
    item.aliases.push(item.name.replace(" ", ""));
    writers.push(new Writer(index, item.name, item.aliases, item.isScheduled));
  }
  deadlineList.load();
  comingEvents.load();
}

function initComponents(){
  rawData = new Vue({
    el: "#rawData",
    data: {
      list: "",
      isVisible: false
    },
    methods:{
      appendHtml: function(){
        var html = calendarData.dumpHtml();
        this.list = html;
      }
    }
  });

  comingEvents = new Vue({
    el: '#comingEvents',
    data: {
      todaysArticles: [],
      tomorrowsArticles: [],
      todaysSchedules: [],
      tomorrowsSchedules: [],
      showInfo: true
    },
    methods: {
      load: function(){
        var events;
        //個人予定のロード（今日）
        events = calendarData.getArticlesOfTheDay(today);
        for(var event of events){
          this.todaysArticles.push({
            id: event.id,
            summary: event.summary,
            publishDate: event.start.date
          });
        }
        
        //掲載予定のロード（今日）
        events = calendarData.getSchedulesOfTheDay(today);
        for(var event of events){
          if(event.summary.match(/締め?切り?/)){
            continue;
          }
          this.todaysSchedules.push({
            id: event.id,
            summary: event.summary,
            date: event.start.date ? new Date(event.start.date) : new Date(event.start.dateTime)
          });
        }
        
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        //個人予定のロード（明日）
        events = calendarData.getArticlesOfTheDay(tomorrow);
        for(var event of events){
          this.tomorrowsArticles.push({
            id: event.id,
            summary: event.summary,
            publishDate: event.start.date
          });
        }
        var events;
        
        //掲載予定のロード（明日）        
        events = calendarData.getSchedulesOfTheDay(tomorrow);
        for(var event of events){
          if(event.summary.match(/締め?切り?/)){
            continue;
          }
          this.tomorrowsSchedules.push({
            id: event.id,
            summary: event.summary,
            date: event.start.date ? new Date(event.start.date) : new Date(event.start.dateTime)
          });
        }
      }
    },
    filters: {
      dateToStr: function(date){
        if(date.getHours() == 0 && date.getMinutes() == 0 && date.getSeconds() == 0 ){
          return '終日'
        } else {
          return date.getHours() + ':' + (date.getMinutes() > 10 ? date.getMinutes() : '0' + date.getMinutes());
        }
      }
    },
    computed: {
      orderedTodaysSchedules: function () {
        return this.todaysSchedules.sort(function(a,b){
          if (a.date < b.date) return -1;
          if (a.date > b.date) return 1;
          return 0;
        })
      },
      orderedTomorrowsSchedules: function () {
        return this.tomorrowsSchedules.sort(function(a,b){
          if (a.date < b.date) return -1;
          if (a.date > b.date) return 1;
          return 0;
        })
      },
      orderedTodaysArticles: function () {
        return this.todaysArticles.sort(function(a,b){
          if (a.summary < b.summary) return -1;
          if (a.summary > b.summary) return 1;
          return 0;
        })
      },
      orderedTomorrowsArticles: function () {
        return this.tomorrowsArticles.sort(function(a,b){
          if (a.summary < b.summary) return -1;
          if (a.summary > b.summary) return 1;
          return 0;
        })
      }
    }
  });

  deadlineList = new Vue({
    el: '#deadlineList',
    data: {
      deadlines: [],
      publishSchedule: []
    },
    methods: {
      addDeadline: function(id, source, writerIndex, deadlineDate, publishDate, deadlineType, recurrence, description) {
        var ar = new Array();

        if(description){
          ar = description.split(';');
        } else {
          ar = ["", false, 0]
        }

        //締切ライターの掲載日が決まってるか調査
        if(publishDate == false){
          for(item of this.publishSchedule){
            if(item.writer == writerIndex && item.publishDate > deadlineDate){
              publishDate = item.publishDate;
              break;
            }
          }
        }

        if(today > deadlineDate){
          var isWithin1Week = true;
        } else {
          //締切１週間前（またはそれより後）かどうか
          var aWeekBeforeDeadline = new Date(deadlineDate);
          aWeekBeforeDeadline.setDate(deadlineDate.getDate() - 7);
          if(today > aWeekBeforeDeadline){
            var isWithin1Week = true;
          } else {
            var isWithin1Week = false;
          }
        }

        //掲載前日（またはそれより後）かどうか
        if(publishDate){
          var aDayBeforePublishing = new Date(publishDate);
          aDayBeforePublishing.setDate(publishDate.getDate() - 1);
          if(today > aDayBeforePublishing){
            var isWithin1Day = true;
          } else {
            var isWithin1Day = false;
          }
        } else {
          var isWithin1Day = false;
        }

        this.deadlines.push({
          id: id,
          source: source,
          writerIndex: writerIndex,
          deadlineDate: deadlineDate,
          publishDate: publishDate,
          deadlineType: deadlineType, //0:締切 1:掲載日
          isWithin1Week: isWithin1Week, //締切の１週間前か、それを過ぎたらtrue
          isWithin1Day: isWithin1Day, //公開日の前日か、それを過ぎたらtrue
          isWithin1Week: isWithin1Week, //締切の１週間前か、それを過ぎたらtrue
          recurrence: recurrence,
          summary: ar[0],
          hasDeadlineAnnounced: (ar[1] == "true" ? true : false),
          status: parseInt(ar[2]),
          saveStatus: 0
        })
      },
      load: function(){
        //掲載日リストの構築
        for(var event of calendarData.siteCalendar){
          var latestAssignedWriter = getAssignedWriter(event.summary);
          var writer = findWriterName(latestAssignedWriter, false);
          var publishDate = new Date(event.start.date);
          this.publishSchedule.push({writer: writer.index, publishDate: publishDate});
        }

        //締切日ライターのロード
        for(var event of calendarData.personalCalendar){
          if(event.summary.match(/締め?切り?/)){
            var writer = findWriterName(event.summary, false);
            if(!writer){console.warn("識別不能な締切予定: " + event.start.date + " " + event.summary); continue;}
            var recurrence = recurrenceToString(event.recurrence);
            var deadlineDate = new Date(event.start.date);
            if(!hasArticleFixed(event) || deadlineDate > today){
              this.addDeadline(event.id, PERSONAL_CALENDER_ID, writer.index, deadlineDate, false, 0, event.recurrence, event.description);
            }
          }
        }

        //掲載日ライターのロード
        for(var event of calendarData.siteCalendar){
          var latestAssignedWriter = getAssignedWriter(event.summary);
          var writer = findWriterName(latestAssignedWriter, true);
          if(!writer){
            //console.warn("識別不能な締切予定: " + event.start.date + " " + event.summary);
            continue;
          }
          var publishDate = new Date(event.start.date);
          var deadlineDate = new Date(event.start.date);
          deadlineDate.setDate(deadlineDate.getDate() - 1);
          if(!hasArticleFixed(event) || deadlineDate > today){
            this.addDeadline(event.id, SITE_CALENDER_ID, writer.index, deadlineDate, publishDate, 1, false, event.description);
            this.publishSchedule.push({writer: writer.index, publishDate: publishDate});
          }
        }
      },
      update: function(i){
        var deadline = this.deadlines[i];
        this.deadlines[i].saveStatus = 1;
        var description = deadline.summary + ';' + deadline.hasDeadlineAnnounced + ';' + deadline.status;
        var result = updateEvent(deadline.source, deadline.id, description).then(function(){
          deadlineList.deadlines[i].saveStatus = 2;
          sleep(2000).then(function(){
            deadlineList.deadlines[i].saveStatus = 0;
          })
        });
      }
    },
    filters: {
      writerName: function(index){
        return WRITERS[index].name;
      },
      dateToStr: function(date){
        if(date){
          return getFormattedDate(date);
        }
      },
      statusStr: function(index){
        return STATUS_ARRAY[index].label;
      },
    },
    computed: {
      orderedDeadlines: function () {
        return this.deadlines.sort(function(a,b){
          if (a.deadlineDate < b.deadlineDate) return -1;
          if (a.deadlineDate > b.deadlineDate) return 1;
          return 0;
        })
      }
    }
  });
}

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

function getAssignedWriter(str){
  return str.replace(/^[0-9]+[a-z]\s?/i, "").split(/→|＞|>/).pop();
}

function hasArticleFixed(event){
  var description = event.description;
  if(description && description.split(';')[2]){
    if(description.split(';')[2] == '3' || description.split(';')[2] == '4' ){
      return true;
    }
  }
  return false;
}

function recurrenceToString(recurrence){
}

function getFormattedDate(date){

  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  var d = date.getDate();
  var w = date.getDay();
  
  var wNames = ['日', '月', '火', '水', '木', '金', '土'];
  
  if (m < 10) {
    m = '0' + m;
  }
  if (d < 10) {
    d = '0' + d;
  }
  return m + '/' + d + ' (' + wNames[w] + ')';
}

function findWriterName(str, fromScheduledWriters){
  for(var writer of writers){
    if(writer.isScheduled == fromScheduledWriters)
    for(var alias of writer.aliases){
      if(str.indexOf(alias) > -1){
        return writer;
      }
    }
  }
  return false;
}