## UI/UX 적용 가이드  2020.06.26 ##

   - 2020년 새롭게 표준화 작업이 진행된 사용자/관리자 포털에 대한 가이드

### 목차
```
1. 사용자포탈 URL
2. 사용자포탈 API
  2-1. 메뉴 목록 조회
  2-2. 메뉴 즐겨찾기 조회
  2-3. 전체화면 메뉴 즐겨찾기 추가
  2-4. 전체화면 메뉴 즐겨찾기 삭제
  2-5. notification 조회
  2-6. 좌측하단 사용자 관련 팝업 호출 url
3. 관리자포탈 API
  3-1. 메뉴 목록 조회 : 임시 url임, 추후 kdn api 호출
  3-2. 메뉴 즐겨찾기 조회
  3-3. 메뉴 즐겨찾기 추가
  3-4. 메뉴 즐겨찾기 삭제
```

#### 1. 사용자포탈 URL
- 신규 개발을 위한 개발서버
- 사용계정은 kepri-demo 사이트와 동일
```
http://www.kepri2-demo.crossent.com
```
#### 2. 사용자포탈 API
##### 2-1. 메뉴 목록 조회
- 호출
    ```
    $ curl -X GET --header 'Accept: application/json' 'http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/menus?token=de26d10dd2294328b937a019c1ddc23b'
    http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/menus?token=de26d10dd2294328b937a019c1ddc23b
    ```
- 결과값
    ```
    {
      "itemCount": 75,
      "items": [
        {
          "iconId": "item1",
          "childCnt": 4,
          "level": 1,
          "depth1": "Compute",
          "depth2": null,
          "isUserPm": true,
          "serviceName": null,
          "urlPath": null,
          "parentId": 0,
          "menuOrder": 1,
          "depth3": null,
          "isManager": true,
          "id": 101,
          "isUser": true
        },
        {
          "iconId": "ico_server",
          "childCnt": 4,
          "level": 2,
          "depth1": "Compute",
          "depth2": "서버 가상화",
          "isUserPm": true,
          "serviceName": "서버가상화 서비스",
          "urlPath": "",
          "parentId": 101,
          "menuOrder": 2,
          "depth3": "",
          "isManager": true,
          "id": 10101,
          "isUser": true
        },
        {
          "iconId": "ico_servermanager",
          "childCnt": 0,
          "level": 3,
          "depth1": "Compute",
          "depth2": "서버 가상화",
          "isUserPm": true,
          "serviceName": "서버가상화 서비스",
          "urlPath": "/#/iaas/compute",
          "parentId": 10101,
          "menuOrder": 3,
          "depth3": "서버 관리",
          "isManager": true,
          "id": 1010101,
          "isUser": true
        },
        {
          "iconId": "ico_diskmanager",
          "childCnt": 0,
          "level": 3,
          "depth1": "Compute",
          "depth2": "서버 가상화",
          "isUserPm": true,
          "serviceName": "서버가상화 서비스",
          "urlPath": "/#/iaas/storage",
          "parentId": 10101,
          "menuOrder": 4,
          "depth3": "디스크 관리",
          "isManager": true,
          "id": 1010102,
          "isUser": true
        },...
    ]
    ```
##### 2-2. 메뉴 즐겨찾기 조회
- 호출
    ```
    $ curl -X GET --header 'Accept: application/json' 'http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/user/myMenu?token=de26d10dd2294328b937a019c1ddc23b'
    http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/user/myMenu?token=de26d10dd2294328b937a019c1ddc23b
    ```
- 결과
    ```
     {
       "itemCount": 3,
       "items": [
         {
           "iconId": "ico_map",
           "childCnt": 2,
           "level": 2,
           "depth1": "Visualization Tools",
           "depth2": "GIS 서비스",
           "isUserPm": true,
           "serviceName": null,
           "urlPath": null,
           "parentId": 104,
           "menuOrder": 73,
           "depth3": null,
           "isManager": true,
           "id": 10401,
           "isUser": true
         },
         {
           "iconId": null,
           "childCnt": 0,
           "level": 3,
           "depth1": "Visualization Tools",
           "depth2": "GIS 서비스",
           "isUserPm": true,
           "serviceName": null,
           "urlPath": null,
           "parentId": 10401,
           "menuOrder": 74,
           "depth3": "저장소 관리",
           "isManager": true,
           "id": 1040101,
           "isUser": true
         },
         {
           "iconId": null,
           "childCnt": 0,
           "level": 3,
           "depth1": "Visualization Tools",
           "depth2": "GIS 서비스",
           "isUserPm": true,
           "serviceName": null,
           "urlPath": null,
           "parentId": 10401,
           "menuOrder": 75,
           "depth3": "레이어 관리",
           "isManager": true,
           "id": 1040102,
           "isUser": true
         }
       ],
       "resultCode": "0",
       "resultMsg": "NORMAL_CODE"
     } 
    ```
##### 2-3. 전체화면 메뉴 즐겨찾기 추가
- 2레벨에서만 진행됨
  - 호출
    ```
    $ curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' 'http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/user/myMenu?token=de26d10dd2294328b937a019c1ddc23b&menuId=10302'
    http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/user/myMenu?token=de26d10dd2294328b937a019c1ddc23b&menuId=10302
    ```
  - 결과
    ```
    {
      "itemCount": 5,
      "items": [
        {
          "iconId": "ico_code",
          "childCnt": 1,
          "level": 2,
          "depth1": "Dev Tools",
          "depth2": "Java 표준 개발환경",
          "isUserPm": true,
          "serviceName": "개발 프레임워크 서비스",
          "urlPath": "",
          "parentId": 103,
          "menuOrder": 52,
          "depth3": "",
          "isManager": true,
          "id": 10302,
          "isUser": true
        },
        {
          "iconId": null,
          "childCnt": 0,
          "level": 3,
          "depth1": "Dev Tools",
          "depth2": "Java 표준 개발환경",
          "isUserPm": true,
          "serviceName": "개발 프레임워크 서비스",
          "urlPath": "/apim/srcgen/sourgent.do",
          "parentId": 10302,
          "menuOrder": 53,
          "depth3": "소스 생성기",
          "isManager": true,
          "id": 1030201,
          "isUser": true
        },
        {
          "iconId": "ico_map",
          "childCnt": 2,
          "level": 2,
          "depth1": "Visualization Tools",
          "depth2": "GIS 서비스",
          "isUserPm": true,
          "serviceName": null,
          "urlPath": null,
          "parentId": 104,
          "menuOrder": 73,
          "depth3": null,
          "isManager": true,
          "id": 10401,
          "isUser": true
        },
        {
          "iconId": null,
          "childCnt": 0,
          "level": 3,
          "depth1": "Visualization Tools",
          "depth2": "GIS 서비스",
          "isUserPm": true,
          "serviceName": null,
          "urlPath": null,
          "parentId": 10401,
          "menuOrder": 74,
          "depth3": "저장소 관리",
          "isManager": true,
          "id": 1040101,
          "isUser": true
        },
        {
          "iconId": null,
          "childCnt": 0,
          "level": 3,
          "depth1": "Visualization Tools",
          "depth2": "GIS 서비스",
          "isUserPm": true,
          "serviceName": null,
          "urlPath": null,
          "parentId": 10401,
          "menuOrder": 75,
          "depth3": "레이어 관리",
          "isManager": true,
          "id": 1040102,
          "isUser": true
        }
      ],
      "resultCode": "0",
      "resultMsg": "NORMAL_CODE"
    }
    ```
##### 2-4. 전체화면 메뉴 즐겨찾기 삭제
- 2레벨에서만 진행됨
  - 호출
    ```
    $ curl -X DELETE --header 'Accept: application/json' 'http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/user/myMenu?token=de26d10dd2294328b937a019c1ddc23b&menuId=10302'
    http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/user/myMenu?token=de26d10dd2294328b937a019c1ddc23b&menuId=10302
    ```
  - 결과
    ```
    {
      "itemCount": 3,
      "items": [
        {
          "iconId": "ico_map",
          "childCnt": 2,
          "level": 2,
          "depth1": "Visualization Tools",
          "depth2": "GIS 서비스",
          "isUserPm": true,
          "serviceName": null,
          "urlPath": null,
          "parentId": 104,
          "menuOrder": 73,
          "depth3": null,
          "isManager": true,
          "id": 10401,
          "isUser": true
        },
        {
          "iconId": null,
          "childCnt": 0,
          "level": 3,
          "depth1": "Visualization Tools",
          "depth2": "GIS 서비스",
          "isUserPm": true,
          "serviceName": null,
          "urlPath": null,
          "parentId": 10401,
          "menuOrder": 74,
          "depth3": "저장소 관리",
          "isManager": true,
          "id": 1040101,
          "isUser": true
        },
        {
          "iconId": null,
          "childCnt": 0,
          "level": 3,
          "depth1": "Visualization Tools",
          "depth2": "GIS 서비스",
          "isUserPm": true,
          "serviceName": null,
          "urlPath": null,
          "parentId": 10401,
          "menuOrder": 75,
          "depth3": "레이어 관리",
          "isManager": true,
          "id": 1040102,
          "isUser": true
        }
      ],
      "resultCode": "0",
      "resultMsg": "NORMAL_CODE"
    }
    ```
  
##### 2-5. notification 조회
- 호출
    ```
    #project_code : Cookies PROJECT-CODE 값
    $ curl -X GET --header 'Accept: application/json' 'http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/notification?token=de26d10dd2294328b937a019c1ddc23b&project_code=42-125'
    http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/notification?token=de26d10dd2294328b937a019c1ddc23b&project_code=42-125
    ```
- 결과 : 7일 이내 전달된 notification에 대해서만 신규 notification으로 조회됨 
    ```
    {
      "counts": 6,
      "itemCount": 6,
      "items": [
        {
          "id": 14,
          "receiver": "u",
          "target": "kepri1234",
          "message": "사용자 알림입니다.",
          "url": "",
          "time": {
            "date": 18,
            "hours": 17,
            "seconds": 22,
            "month": 5,
            "nanos": 0,
            "timezoneOffset": -540,
            "year": 120,
            "minutes": 23,
            "time": 1592468602000,
            "day": 4
          }
        },
        {
          "id": 15,
          "receiver": "u",
          "target": "kepri1234",
          "message": "사용자 알림 2번째입니다.",
          "url": "",
          "time": {
            "date": 18,
            "hours": 17,
            "seconds": 29,
            "month": 5,
            "nanos": 0,
            "timezoneOffset": -540,
            "year": 120,
            "minutes": 23,
            "time": 1592468609000,
            "day": 4
          }
        },
        {
          "id": 16,
          "receiver": "p",
          "target": "42-125",
          "message": "프로젝트 알림 첫번째 입니다.",
          "url": "",
          "time": {
            "date": 18,
            "hours": 17,
            "seconds": 47,
            "month": 5,
            "nanos": 0,
            "timezoneOffset": -540,
            "year": 120,
            "minutes": 23,
            "time": 1592468627000,
            "day": 4
          }
        },
        {
          "id": 17,
          "receiver": "p",
          "target": "42-125",
          "message": "프로젝트 알림 2번째 입니다.",
          "url": "",
          "time": {
            "date": 18,
            "hours": 17,
            "seconds": 1,
            "month": 5,
            "nanos": 0,
            "timezoneOffset": -540,
            "year": 120,
            "minutes": 41,
            "time": 1592469661000,
            "day": 4
          }
        },
        {
          "id": 18,
          "receiver": "p",
          "target": "42-125",
          "message": "프로젝트 알림 3번째 입니다.",
          "url": "",
          "time": {
            "date": 18,
            "hours": 17,
            "seconds": 5,
            "month": 5,
            "nanos": 0,
            "timezoneOffset": -540,
            "year": 120,
            "minutes": 41,
            "time": 1592469665000,
            "day": 4
          }
        },
        {
          "id": 19,
          "receiver": "p",
          "target": "42-125",
          "message": "프로젝트 알림 3번째 입니다.",
          "url": "",
          "time": {
            "date": 18,
            "hours": 17,
            "seconds": 9,
            "month": 5,
            "nanos": 0,
            "timezoneOffset": -540,
            "year": 120,
            "minutes": 41,
            "time": 1592469669000,
            "day": 4
          }
        }
      ],
      "resultCode": "0",
      "resultMsg": "NORMAL_CODE"
    }
    ```

##### 2-6. 좌측하단 사용자 관련 팝업 호출 url
- 비밀번호 설정
    ```
    http://www.kepri2-demo.crossent.com/#/comm/memberEdit/password
    ```
- 회원탈퇴
    ```
    http://www.kepri2-demo.crossent.com/#/comm/memberEdit/signout
    ```

#### 3. 관리자포탈 API
##### 3-1. 메뉴 목록 조회 : 임시 url임, 추후 kdn api 호출
- 호출
    ```
    $ curl -X GET --header 'Accept: application/json' 'http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/adminMenus/temp'
    http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/adminMenus/temp
    ```
- 결과값
    ```
    {
      "itemCount": 91,
      "items": [
        {
          "parentNm": null,
          "menuOrder": 1,
          "level": 0,
          "serviceNm": "관리자 포털",
          "useYn": "Y",
          "id": "HUB",
          "iconPath": null,
          "urlPath": null,
          "parentId": "#",
          "urlParam": null
        },
        {
          "parentNm": "관리자 포털",
          "menuOrder": 1,
          "level": 1,
          "serviceNm": "공통 메뉴",
          "useYn": "Y",
          "id": "HUB201",
          "iconPath": "ico_dashboard",
          "urlPath": null,
          "parentId": "HUB",
          "urlParam": null
        },
        {
          "parentNm": "공통메뉴",
          "menuOrder": 1,
          "level": 2,
          "serviceNm": "내 정보",
          "useYn": "Y",
          "id": "HUB20101",
          "iconPath": "ico_usersetting",
          "urlPath": "/cloud/#/comm/memberInfo",
          "parentId": "HUB201",
          "urlParam": null
        },
        {
          "parentNm": "공통메뉴",
          "menuOrder": 2,
          "level": 2,
          "serviceNm": "사용자 관리",
          "useYn": "Y",
          "id": "HUB20102",
          "iconPath": "ico_usersetting",
          "urlPath": null,
          "parentId": "HUB201",
          "urlParam": null
        },
        {
          "parentNm": "사용자 관리",
          "menuOrder": 1,
          "level": 3,
          "serviceNm": "운영자 관리",
          "useYn": "Y",
          "id": "HUB2010201",
          "iconPath": "",
          "urlPath": "/cloud/#/comm/adminUsers",
          "parentId": "HUB20102",
          "urlParam": null
        },
        {
          "parentNm": "사용자 관리",
          "menuOrder": 2,
          "level": 3,
          "serviceNm": "사용자 관리",
          "useYn": "Y",
          "id": "HUB2010202",
          "iconPath": "",
          "urlPath": "/cloud/#/comm/users",
          "parentId": "HUB20102",
          "urlParam": null
        },
        {
          "parentNm": "공통메뉴",
          "menuOrder": 3,
          "level": 2,
          "serviceNm": "프로젝트 관리",
          "useYn": "Y",
          "id": "HUB20103",
          "iconPath": "ico_script",
          "urlPath": null,
          "parentId": "HUB201",
          "urlParam": null
        },
        {
          "parentNm": "프로젝트 관리",
          "menuOrder": 1,
          "level": 3,
          "serviceNm": "쿼터 항목 관리",
          "useYn": "Y",
          "id": "HUB2010301",
          "iconPath": null,
          "urlPath": "/cloud/#/comm/quota_items",
          "parentId": "HUB20103",
          "urlParam": null
        },
        {
          "parentNm": "프로젝트 관리",
          "menuOrder": 2,
          "level": 3,
          "serviceNm": "참조플랜 관리",
          "useYn": "Y",
          "id": "HUB2010302",
          "iconPath": null,
          "urlPath": "/cloud/#/comm/quota_plans",
          "parentId": "HUB20103",
          "urlParam": null
        },
        {
          "parentNm": "프로젝트 관리",
          "menuOrder": 3,
          "level": 3,
          "serviceNm": "프로젝트 관리",
          "useYn": "Y",
          "id": "HUB2010303",
          "iconPath": null,
          "urlPath": "/cloud/#/comm/org/projects",
          "parentId": "HUB20103",
          "urlParam": null
        },...
    ]
    ```
##### 3-2. 메뉴 즐겨찾기 조회
- 호출
    ```
    $ curl -X GET --header 'Accept: application/json' 'http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/admin/myMenu?token=6f80229fd68440e1b98ceef80cea6e89' 
    ```
- 결과값
    ```
    {
      "itemCount": 2,
      "items": [
        {
          "menuId": "HUB20103"
        },
        {
          "menuId": "HUB20201"
        }
      ],
      "resultCode": "0",
      "resultMsg": "NORMAL_CODE"
    }
    ```
##### 3-3. 메뉴 즐겨찾기 추가
- 2레벨에서만 진행됨
  - 호출
    ```
    $ curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' 'http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/admin/myMenu?token=6f80229fd68440e1b98ceef80cea6e89&menuId=HUB20201'
    http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/admin/myMenu?token=6f80229fd68440e1b98ceef80cea6e89&menuId=HUB20404
    ```
  - 결과값
    ```
    {
      "itemCount": 3,
      "items": [
        {
          "menuId": "HUB20103"
        },
        {
          "menuId": "HUB20201"
        },
        {
          "menuId": "HUB20404"
        }
      ],
      "resultCode": "0",
      "resultMsg": "NORMAL_CODE"
    }
    ```
##### 3-4. 메뉴 즐겨찾기 삭제
- 2레벨에서만 진행됨
- 호출
    ```
    $ curl -X DELETE --header 'Accept: application/json' 'http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/admin/myMenu?token=6f80229fd68440e1b98ceef80cea6e89&menuId=HUB20201'
    http://www.kepri2-demo.crossent.com/comm-api/api/hubpop/v1/admin/myMenu?token=6f80229fd68440e1b98ceef80cea6e89&menuId=HUB20404
    ```
- 결과값
    ```
    {
      "itemCount": 2,
      "items": [
        {
          "menuId": "HUB20103"
        },
        {
          "menuId": "HUB20201"
        }
      ],
      "resultCode": "0",
      "resultMsg": "NORMAL_CODE"
    }
    ```
  