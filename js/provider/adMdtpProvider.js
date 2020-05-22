angular.module('app', ['ADM-dateTimePicker'])
    .config(['ADMdtpProvider', function(ADMdtpProvider) {
        ADMdtpProvider.setOptions({
                calType: 'gregorian',
                format: 'YYYY-MM-DD',
                autoClose:true,
                multiple: false,
                smartDisabling: false,
                dtpType: "date",
                watchingOptions: true,
                zIndex: 200,
                //default: 'today',
                gregorianDic: {
                    title: 'korean',
                    monthsNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                    daysNames: ['일', '월', '화', '수', '목', '금', '토'],
                    todayBtn: "오늘"
                }
            }
        );
    }])
;
