## WEB UI Structure ##

### 공통 파일 ( js ) ###
1. index.html
    - 최초 로드 페이지
    - 사용되는 css 및 js 로드
    - MODE (DEV, DEBUG) 및 version 셋팅
    
2. js/cmmFunction.js
	- scope와 상관 없이 사용 할 공통 변수, 객체, 함수 정의

3. js/app.js
	- 컨포넌트 로드
	- stateProvider.state 정의 => url 정의
	- 모든 URL은 기본적으로 CONSTANTS.mainBody(mainBodyCtrl, views/mainBody.html)를 호출 하도록 되어 있음
	- js/properties/sitemap.js에 정의 되어 있는 controller와 page는 mainBodyCtrl 내에서 로드 함

4. js/controllers
    - commonCotrollers.js
	    - mainCtrl
		    - 최초 접근시 호출 기본 셋팅
		    - 페이지 replace 시 호출
	    - mainBodyCtrl
		    - url 이동시 호출 여기에서 js/properties/sitemap.js에 정의 되어 있는 url에 따라 페이지 출력
		    - 페이지 이동 시 마다 다시 셋팅 해야될 항목 정의
		    - page 접근 권한 체크
    - portalControllers.js
        - 사용자 포탈에서 만 공용으로 사용 할 Controller일 있을 경우 정의 
    - userControllers.js
        - 사용자 관련 Controller 정의
    - 그외 각각의 업무 관련 Controllers 정의 

5. js/services
    - commonServices.js
        - common : 공통함수 정의
            - 메뉴 리스트 기본 값 초기화
            - 메뉴 처리
            - 공통 데이터 처리
        - cache : cache 컨트롤
        - cookies : cookies 컨트롤
    - cloudFoundryServices.js
        - cloudFound Api 정의
    - userServices.js
        - 사용자 관려 Api 정의
    - 그외 각각의 업무 관련 Services 정의 
    
6. js/directives
	- commonDirective.js
		- 사용자 정의 공통 filter, directive
		- propsFilter : 요소별 필터
		- dynamicTemplate : text를 angujerjs로 컴파일 하여 적용

7. js/locales
	- 언어팩 (menu, label, message) 정의
	
8. js/properties
	- constants.js
		- 기본 설정정보 관리
	- codes.js
		- 코드 정보 관리
	- sitemap.js
		- 페이지 및 링크 정보 관리
	- message.js
		- 시스템 메세지 정의(언어팩 로드 전에 필요 한 메세지)


### 공통 파일 ( views ) ###
1. view
	- navigation.html
		- 최상단 navigation 영역
		- index.html에서 ng-include를 통해 불러옴
		- 로그인 후에는 항상 유지
	- leftMenu.html
		- left 메뉴 영역
		- index.html에서 ng-include를 통해 불러옴
	- mainTop.html
		- 메인 필터 영역
		- index.html에서 ng-include를 통해 불러옴
	- mainBody.html
		- 메인 컨텐츠 영역
		- ng-view를 통해 불러옴
		- 내부에서 ng-include를 통해 컨텐츠 영역 호출(controller, TemplateUrl)

2. view/common
	- popCommForm.html : 팝업 공통 창 Template

### controller 구조 ###
1. 호출 구조
    - url호출 => mainCtrl(처음로드시) => mainBodyCtrl => contentsCtrl
	- url이동 => mainBodyCtrl => contentsCtrl
	- mainCtrl은 최로 접속 시나 페이지 replace를 하였을 때만 호출 되고, 일반적인 페이지 이동시에는 mainCtrl은 호출 되지 않음
	- contentsCtrl : js/properties/sitemap.js에 정의되어 있는 url에 따른 controller

2. controller as 구문 사용
    - mainCtrl as main : 모든 Html 페이지에서 main.objectName 로 접근 가능
    - mainBodyCtrl as mainBody
    - contentsCtrl(각각의 정의 된 화면 controller) as contents
    
3. controller 함수 및 변수 정의
    - 외부 참조 변수 및 함수는 $scope에 정의
    - 내부 사용 변수 및 함수는<br>
     var ct = this;<br>
     형태로 정의 후 ct에 정의<br>
     ct.functionName = function () {};<br>
     Html에서는 contents.objectName 형태로 사용
    - popup에서 사용 하는 변수 및 함수는<br>
     var pop = $scope.pop = {};<br>
     정의 후 사용<br>
     Html에서는 pop.objectName 로 사용


### 사용 컴포넌트 ###
1. bootstra
    - Glyphicons/ Button / Tooltip / Dropdowns / Thumbnails / Progress bar / Tab(내용 미포함) 등 기본
    - 샘플 URL : http://bootstrapk.com

2. material
    - Tab(내용 포함) / Dailog / Check / Radio / Progress loading / Switch 
    - 샘플 URL : https://material.angularjs.org/latest

3.  AngularJS Slider
    - Slider
    - 샘플 URL : http://angular-slider.github.io/angularjs-slider

4. bootstrap-select
    - 기본적인 Select Box
    - 참고 URL : https://silviomoreto.github.io/bootstrap-select/examples

5. select2
    - 특수한 Select Box
    - 참고 URL : https://select2.github.io/examples.html

6. dataPicker
    - dataPicker 
    - https://amirkabirdataminers.github.io/ADM-dateTimePicker

