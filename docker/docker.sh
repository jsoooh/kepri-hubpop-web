#!/bin/bash

set -eu

SCRIPT_DIR=$(dirname $0)
docker_home=${SCRIPT_DIR}
docker_home=`realpath ${docker_home}`
web_home=${docker_home}/..
web_home=`realpath ${web_home}`

container_name=cx-web
image_name=cx-web
image_version=latest

: ${DOCKER_PUSH_SERVER:=crossentcx}
push_server=${DOCKER_PUSH_SERVER}

push_image_version=latest
push_image_name=${push_server}/${image_name}

nextPushServer="false"
nextVersion="false"
isComment="false"
actions=()
for i in $*
do
    if [ $nextPushServer == "true" ]; then
        push_server="${i}"
        nextPushServer="false"
    elif [ $nextVersion == "true" ]; then
        image_version="${i}"
        push_image_version="${i}"
        nextVersion="false"
    else
        if [ "${i}" == "package" ]; then
            actions+=("package")
            isComment="true"
        elif [ "${i}" == "build" ]; then
            actions+=("build")
            isComment="true"
        elif [ "${i}" == "run" ]; then
            actions+=("run")
            isComment="true"
        elif [ "${i}" == "push" ]; then
            actions+=("push")
            isComment="true"
        elif [ "${i}" == "clear" ]; then
            actions+=("clear")
            isComment="true"
        elif [ "${i}" == "clearAll" ]; then
            actions+=("clearAll")
            isComment="true"
        elif [ "${i}" == "rm" ]; then
            actions+=("rm")
            isComment="true"
        elif [ "${i}" == "save" ]; then
            actions+=("save")
            isComment="true"
        elif [ "${i}" == "all" ]; then
            actions+=("all")
            isComment="true"
        elif [ "${i}" == "-s" ]; then
            nextPushServer="true"
        elif [ "${i}" == "-v" ]; then
            nextVersion="true"
        fi
    fi
done

echo "image_version: $image_version"
echo "push_image_version: $push_image_version"

function WebPackage() {
    if [ ! -d "${docker_home}/dist" ]
    then
        echo "mkdir ${docker_home}/dist"
        mkdir ${docker_home}/dist
    fi

    if [ ! -d "${docker_home}/dist/html" ]
    then
        echo "mkdir ${docker_home}/dist/html"
        mkdir ${docker_home}/dist/html
    else
        rm -fR ${docker_home}/dist/html/*
    fi

    if [ -f "${docker_home}/dist/html.tar.gz" ]
    then
        echo "rm -f ${docker_home}/dist/html.tar.gz"
        rm -f ${docker_home}/dist/html.tar.gz
    fi

    echo "cp web index.html css fonts images img js views download login"
    cp ${web_home}/index.html ${docker_home}/dist/html/
    cp -R ${web_home}/css ${docker_home}/dist/html/
    cp -R ${web_home}/fonts ${docker_home}/dist/html/
    cp -R ${web_home}/images ${docker_home}/dist/html/
    cp -R ${web_home}/img ${docker_home}/dist/html/
    cp -R ${web_home}/js ${docker_home}/dist/html/
    cp -R ${web_home}/views ${docker_home}/dist/html/
    cp -R ${web_home}/download ${docker_home}/dist/download/
    cp -R ${web_home}/login ${docker_home}/dist/html/

    pushd ${docker_home}/dist > /dev/null
    echo "tar cfpz  html.tar.gz html"
    tar cfpz  html.tar.gz html
    popd > /dev/null
    sleep 1

    echo "rm -fR ${docker_home}/dist/html"
    rm -fR ${docker_home}/dist/html
}

function RmContainer() {
    start_container_count=$(docker container list | grep "${image_name} " | grep " ${image_version} " | grep ${container_name} | wc -l || true)
    echo "start_container_count: ${start_container_count}"
    if [ "${start_container_count}" ==  "1" ]; then
        echo "docker container stop ${container_name}"
        docker container stop ${container_name}
        echo "docker container rm ${container_name}"
        docker container rm ${container_name}
    else
        stop_container_count=$(docker ps -a | grep "${image_name} " | grep " ${image_version} " | grep "${container_name} " | wc -l || true)
        echo "stop_container_count: ${stop_container_count}"
        if [ "${stop_container_count}" ==  "1" ]; then
            echo "docker container rm ${container_name}"
            docker container rm ${container_name}
        fi
    fi
}

function ClearImage() {
    REPOSITORY=$(docker images | grep "${image_name} " | grep " ${image_version} " | awk -F' ' '{print $1}' || true)
    echo "REPOSITORY: ${REPOSITORY}"
    if [ "${REPOSITORY}" ==  "${image_name}" ]; then
        start_container_count=$(docker container list | grep "${image_name} " | grep " ${image_version} " | wc -l || true)
        echo "start_container_count: ${start_container_count}"
        if [ "${start_container_count}" ==  "1" ]; then
            container_id=$(docker container list | grep "${image_name} " | grep " ${image_version} " | awk -F' ' '{print $1}' || true)
            echo "docker container stop ${container_id}"
            docker container stop ${container_id}
            echo "docker container rm ${container_id}"
            docker container rm ${container_id}
        else
            stop_container_count=$(docker ps -a | grep "${image_name} " | grep " ${image_version} " | wc -l || true)
            echo "stop_container_count: ${stop_container_count}"
            if [ "${stop_container_count}" ==  "1" ]; then
                container_id=$(docker ps -a | grep "${image_name} " | grep " ${image_version} " | awk -F' ' '{print $1}' || true)
                echo "docker container rm ${container_id}"
                docker container rm ${container_id}
            fi
        fi
        echo "docker image rm ${image_name}:${image_version}"
        docker image rm ${image_name}:${image_version}
    fi
}

function RmPushImage() {
    image_count=$(docker images | grep "${push_image_name} " | grep " ${push_image_version} " | wc -l || true)
    echo "image_count: ${image_count}"
    if [ "${image_count}" ==  "1" ]; then
        echo "docker image rm ${push_image_name}:${push_image_version}"
        docker image rm ${push_image_name}:${push_image_version}
    fi
}

function DockerBuild() {
    ClearImage

    pushd ${docker_home} > /dev/null
    echo "docker build -t ${image_name}:${image_version} ."
    docker build -t ${image_name}:${image_version} .
    popd > /dev/null
    sleep 1
}

function DockerPush() {
    RmPushImage

    echo "docker image tag ${image_name}:${image_version} ${push_image_name}:${push_image_version}"
    docker image tag ${image_name}:${image_version} ${push_image_name}:${push_image_version}

    echo "docker push ${push_image_name}:${push_image_version}"
    docker push ${push_image_name}:${push_image_version}

    sleep 1
}

function DockerSave() {
    pushd ${docker_home} > /dev/null
    if [ -f ${image_name}-${image_version}.tar ]; then
        echo "rm -f ${image_name}-${image_version}.tar"
        rm -f ${image_name}-${image_version}.tar
    fi
    echo "docker save -o ${image_name}-${image_version}.tar ${image_name}:${image_version}"
    docker save -o ${image_name}-${image_version}.tar ${image_name}:${image_version}
    popd > /dev/null
    sleep 1
}

function RunContainer() {
    RmContainer

    docker run -d -p 80:80 \
    -e COMM_API_PROXY_PAAS=http://192.168.99.100:8081 \
    -e IAAS_API_PROXY_PAAS=http://192.168.99.100:8082 \
    -e MONIT_API_PROXY_PAAS=http://192.168.99.100:8083 \
    --name ${container_name} ${image_name}:${image_version}
}

if [ "${isComment}" == "true" ]; then
    for action in ${actions[@]}
    do
        if [ "${action}" = "package" ]; then
            WebPackage
        elif [ "${action}" == "build" ]; then
            DockerBuild
        elif [ "${action}" == "run" ]; then
            RunContainer
        elif [ "${action}" == "push" ]; then
            DockerPush
        elif [ "${action}" == "clear" ]; then
            ClearImage
        elif [ "${action}" == "clearAll" ]; then
            RmPushImage
            ClearImage
        elif [ "${action}" == "rm" ]; then
            RmContainer
        elif [ "${action}" == "save" ]; then
            DockerSave
        elif [ "${action}" == "all" ]; then
            WebPackage
            DockerBuild
            #DockerSave
            DockerPush
        fi
    done
else
    echo "Not Commend"
    echo "Commend: ./docker.sh package|build|run|all [-s <pushServer>] [-v <version>]"
    echo "Commend: ./docker.sh package build run [-v <version>]"
    echo "Commend: ./docker.sh package build [-v <version>]"
    echo "Commend: ./docker.sh build run [-v <version>]"
    echo "Commend: ./docker.sh all [-s <pushServer>] [-v <version>]"
    echo "Commend: ./docker.sh push [-s <pushServer>] [-v <version>]"
    echo "Commend: ./docker.sh clear [-v <version>]"
    echo "Commend: ./docker.sh clearAll [-v <version>]"
    echo "Commend: ./docker.sh rm [-v <version>]"
    echo "Commend: ./docker.sh save [-v <version>]"
fi
