'use strict';

angular.module('app')
    .constant('SITEMAP', {
        pages : {
            main : {
                url: '/',
                templateUrl: _VIEWS_ + '/main/main.html',
                controller: 'mainContentsCtrl'
            },
            login : {
                url: '/login',
                templateUrl: _VIEWS_ + '/login/login.html',
                controller: 'loginCtrl'
            },
            passwordresetemail : {
                url: '/login/passwordResetMail',
                templateUrl: _VIEWS_ + '/login/passwordResetMail.html',
                controller: 'passwordResetEmailCtrl'
            },
            resendVerifyEmail : {
                url: '/login/resendMail',
                templateUrl: _VIEWS_ + '/login/resendVerifyMail.html',
                controller: 'resendverifymailCtrl'
            },
            signup : {
                url: '/signup',
                templateUrl: _VIEWS_ + '/signup/signup.html',
                controller: 'signupCtrl'
            },
            verify : {
                url: '/verify/signup',
                templateUrl: _VIEWS_ + '/verify/verifySignup.html',
                controller: 'verifyUserCtrl'
            },
            passwordreset : {
                url: '/verify/passwordReset',
                templateUrl: _VIEWS_ + '/verify/verifyPasswordReset.html',
                controller: 'passwordResetVerifyCtrl'
            },
            member : {
                url: '/member',
                templateUrl: _VIEWS_ + '/member/memberInfo.html',
                controller: 'memberCtrl'
            },
            company : {
                url: '/company',
                templateUrl: _VIEWS_ + '/member/companyInfo.html',
                controller: 'companyCtrl'
            },
            intro: {
                url: '/intro',
                templateUrl: _VIEWS_ + '/intro/intro.html',
                controller: 'mainContentsCtrl'
            },
            product: {
                url: '/product',
                templateUrl: _VIEWS_ + '/product/product.html',
                controller: 'mainContentsCtrl'
            },
            productComputingServer: {
                url: '/product/iaas/computing/server',
                templateUrl: _VIEWS_ + '/product/computing/server.html',
                controller: 'mainContentsCtrl'
            },
            productComputingAutoscaling: {
                url: '/product/iaas/computing/autoscaling',
                templateUrl: _VIEWS_ + '/product/computing/autoscaling.html',
                controller: 'mainContentsCtrl'
            },
            productIaasNetworkLoadBalancer: {
                url: '/product/iaas/network/loadbalancer',
                templateUrl: _VIEWS_ + '/product/network/loadBalancer.html',
                controller: 'mainContentsCtrl'
            },
            productIaasNetworkipsecVpn: {
                url: '/product/iaas/network/ipsecvpn',
                templateUrl: _VIEWS_ + '/product/network/ipsecVpn.html',
                controller: 'mainContentsCtrl'
            },
            productIaasStorageBlock: {
                url: '/product/iaas/storage/blockstorage',
                templateUrl: _VIEWS_ + '/product/storage/blockStorage.html',
                controller: 'mainContentsCtrl'
            },
            productIaasStorageObject: {
                url: '/product/iaas/storage/objectstorage',
                templateUrl: _VIEWS_ + '/product/storage/objectStorage.html',
                controller: 'mainContentsCtrl'
            },
            productIaasStorageBackup: {
                url: '/product/iaas/storage/backup',
                templateUrl: _VIEWS_ + '/product/storage/backup.html',
                controller: 'mainContentsCtrl'
            },
            productPaas: {
                url: '/product/paas',
                templateUrl: _VIEWS_ + '/product/paas/paasMain.html',
                controller: 'mainContentsCtrl'
            },
            productDevopsManager: {
                url: '/product/devops/git',
                templateUrl: _VIEWS_ + '/product/devops/devopsGit.html',
                controller: 'mainContentsCtrl'
            },
            productDevopsDeploy: {
                url: '/product/devops/cicd',
                templateUrl: _VIEWS_ + '/product/devops/devopsCiCd.html',
                controller: 'mainContentsCtrl'
            },
            productDevopsTools: {
                url: '/product/devops/wide',
                templateUrl: _VIEWS_ + '/product/devops/devopsWide.html',
                controller: 'mainContentsCtrl'
            },
            notice: {
                url: '/support/:boardCode/:boardId',
                templateUrl: _VIEWS_ + '/support/boards.html',
                controller: 'boardsCtrl'
            },
            support: {
                url: '/support/:boardCode',
                templateUrl: _VIEWS_ + '/support/boards.html',
                controller: 'boardsCtrl'
            },
            guide: {
                url: '/guide',
                templateUrl: _VIEWS_ + '/guide/userguide.html',
                controller: 'guidesCtrl'
            },
            token : {
                url: '/token/:token'
            }
        },
        leftMenus: {
        }

	})
;