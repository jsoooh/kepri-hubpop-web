angular.module('app')
    .filter('only', ['$filter', function ($filter) {
          return function (input, decimals) {
            return $filter('number')(input * 100, decimals) + '%';
          };
     }])
     .filter('elapseTime', ['$filter', function ($filter) {
           return function (input) {
               if(input) {
                   var inputDate = input instanceof Date ? input : new Date(input);
                   var diff = new Date(new Date().getTime() - inputDate.getTime());

                   var elapse = {
                       year : Number(diff.getFullYear() - 1970),
                       month : Number(diff.getMonth() -1),
                       day : Number(diff.getDate() - 1),
                       hour : Number(diff.getHours() - 9),
                       minute : Number(diff.getMinutes())
                   };

                   if(elapse.month < 0 && elapse.month != -1) {
                       elapse.year -= 1;
                       elapse.month = 12 + elapse.month;
                   }

                   if(elapse.hour < 0 && elapse.month != -9) {
                       elapse.day -= 1;
                       elapse.hour = 24 + elapse.hour;
                   }

                   if(elapse.minute < 0) {
                       elapse.hour -= 1;
                       elapse.minute = 60 + elapse.minute;
                   }

                   var returnStr = "";
                   if(elapse.year > 0) {
                       returnStr = elapse.year + "년 ";
                       if(elapse.month > 0) {
                           returnStr += elapse.month + "개월";
                       }
                   } else if(elapse.month > 0 && elapse.year <= 0) {
                       returnStr = elapse.month + "개월 ";
                       if(elapse.day > 0) {
                           returnStr += elapse.day + "일";
                       }
                   } else if(elapse.day > 0 && elapse.month <= 0 && elapse.year <= 0) {
                       returnStr = elapse.day + "일 ";
                       if(elapse.hour > 0) {
                           returnStr += elapse.hour + "시간";
                       }
                   } else if(elapse.hour > 0 && elapse.day <= 0 && elapse.month <= 0 && elapse.year <= 0) {
                       returnStr = elapse.hour + "시간 ";
                       if(elapse.minute > 0) {
                           returnStr += elapse.minute + "분";
                       }
                   } else {
                       returnStr = elapse.minute + "분";
                   }


                   return returnStr;
               }
           };
      }])
    .filter('splitStr', ['$filter', function ($filter) {
        return function(input, splitChar, splitIndex) {
              return input.split(splitChar)[splitIndex];
          };
    }])
    .filter('replace', [function () {

        return function (input, from, to) {
          
          if(input === undefined) {
            return;
          }
      
          var regex = new RegExp(from, 'g');
          return input.replace(regex, to);
           
        };
    }])
    .filter('iaasVmState', [function() {
        return function (input) {

            var json = {};
            json['active']    = '활성';
            json['paused']    = '일시정지';
            json['stopped']   = '정지';
            json['starting']  = '시작중';
            json['rebooting'] = '재시작중';
            json['pausing']   = '일시정지중';
            json['unpausing'] = '정지해제중';
            json['stopping']  = '정지중';
            json['error']     = '오류';
            json['shelved']  = '비활성화중';
            json['unshelved']  = '활성화중';

            return json[input];
        };
    }])
;
