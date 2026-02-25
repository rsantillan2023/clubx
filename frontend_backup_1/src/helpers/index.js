import moment from "moment";
import store from "../store/index";
import axios from '../middlewares/index';
import {  getCurrentLocation, getDistance } from '../service/locationService';

export function isDev() {
  var host = window.location.host;
  var isDev = false;
  if (process.env.VUE_APP_ENVIROMENT != "production" || host.includes("dev-")) {
    isDev = true
  }
  return isDev;
}

export function calcDistance(location){
  return new Promise((resolve) => {
    getCurrentLocation().then((currentLocation) =>  {
      let lejos = getDistance(currentLocation.lat, currentLocation.lng, location.lat, location.lng).toFixed(0);
      //lejos= 0.5 //OJOOO
      resolve(lejos);
    }).catch(function () {
      resolve('--');
    });
  });
}

export function toDateNomal(string) {
  return moment(string, 'YYYY-MM-DD HH:mm:ss.SSS').format("DD/MM/YYYY HH:mm");
}

export function unescape(string) {

  //create an element with that html
  var e = document.createElement("textarea");
  //get the html from the created element
  e.innerHTML = string;

  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}


export function getMetadataLive(){
    var hostFinal = getHostFinal();
    return new Promise((resolve) => {
      axios.get(`${process.env.VUE_APP_USER_MAIN_URI}/business/${hostFinal}`)
      .then(function (response) {
        try {
          var metadataJson = JSON.parse(response.data.Metadata);
          resolve(metadataJson);
        } catch (e) {
          resolve(null);
        }
      })
      .catch(function () {
        resolve(null)
      });
    })
}

export function getMetadata(){
  console.log(store.state.user);
  if(store.state.user.Emp_Data.Metadata != undefined){
      try {
        var metadataJson = JSON.parse(store.state.user.Emp_Data.Metadata);
        return metadataJson;
      } catch (e) {
        console.log('error parse json', e);
        return null;
      }
  }
  return null;
}

export function isCustomEmp(){
  if(store.state.user.Emp_Data.Metadata != undefined){
      try {
        var metadataJson = null;
        if(typeof store.state.user.Emp_Data === 'object'
            && store.state.user.Emp_Data !== null
            && store.state.user.Emp_Data.Metadata.networkName !== undefined){
          metadataJson = store.state.user.Emp_Data.Metadata;
        }else{
          metadataJson = JSON.parse(store.state.user.Emp_Data.Metadata);
        }
        if(metadataJson.customNetworkName != undefined
          && metadataJson.customNetworkName != ''){
            return metadataJson;
        }
      } catch (e) {
        console.log('error parse json', e);
        return null;
      }
  }
  return null;
}

export function testInternetConnection(){
    return new Promise((resolve) => {
      axios.post(process.env.VUE_APP_API_URL_ALARMS+'/connection', {}, { timeout: 5000 })
        .then(function() {
          resolve(true);
        }).catch(function(){
          resolve(false);
        });
    });
}

export function getStatusConsultaFixBadText(estado) {
  return String(estado)
          .replace("EnProceso", "En Proceso")
          .replace("ACompletar", "A Completar")
          .replace("AResolver", "A Resolver");
}

export function getSubdomain() {
  var host = window.location.host;
  if (process.env.VUE_APP_ENVIROMENT != "production") {
    //host = "dev-agd.uxshows.com";
    // host = "dev-muni.uxshows.com";
    host = "dev-sooft.uxshows.com";
    //host = "dev-ecr.uxshows.com";
  }
  //host = "dev-sooft.uxshows.com";
  let subdomain = host.split(".")[0];
  let fix = '';
  if (subdomain.includes("-")) {
    fix = subdomain.split("-")[1]; //Soporte para dev
    if(fix == 'tv'){
      fix = subdomain.split("-")[0]; //Soporte para tv
    }
  }else{
    fix = subdomain;
  }
  return fix;
}

export function getHostFinal() {
  var host = window.location.host;
  if (process.env.VUE_APP_ENVIROMENT != "production") {
    //host = "dev-agd.uxshows.com";
    // host = "dev-muni.uxshows.com";
    //host = "dev-sagropecuarios.uxshows.com";
    host = "dev-sooft.uxshows.com";
    //host = "dev-ecr.uxshows.com";
  }
  //host = "dev-sooft.uxshows.com";
  let subdomain = host.split(".")[0];
  let fix = '';
  if (subdomain.includes("-")) {
    fix = subdomain.split("-")[1]; //Soporte para dev
    if(fix == 'tv'){
      fix = subdomain.split("-")[0]; //Soporte para tv
    }
  }else{
    fix = subdomain;
  }
  return fix + ".uxshows.com";
}

export function hasRol(rol) {
  var roles = String(store.state.user.Usu_Roles ? store.state.user.Usu_Roles : 'none')
  return roles.includes(rol);
}

export function isTv() {
  // logica para tv home
  var host = window.location.host;
  // host = "anjor-tv.uxshows.com";
  var subdomain = host.split(".")[0];
  if (subdomain.includes("-")) {
    var split = subdomain.split("-");
    return (
      (split[2] != undefined && split[2] == "tv") ||
      (split[1] != undefined && split[1] == "tv")
    );
  }
  return false;
}

export function isSafari() {
  return /Chrome|CriOS/.test(navigator.userAgent) == false
  && navigator.userAgent.match(/Safari/) !== null
}

export function isMac() {
  const userAgent = navigator.userAgent.toLowerCase();
  return /macintosh|macintel|macppc|mac68k|macos/.test(userAgent);
}

export function isIos() {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

export function isClient(client) {
  return window.location.href.includes(client);
}

export function isChrome() {
  return /Chrome|CriOS/.test(navigator.userAgent);
}

export function isMobileDetect() {
  return /CriOS|iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function isPwa() {
  let displayPwa = false;
  const mqStandAlone = "(display-mode: standalone)";
  const mqFullscreen = "(display-mode: fullscreen)";
  if (navigator.standalone || window.matchMedia(mqStandAlone).matches) {
    displayPwa = true;
  }
  if (window.matchMedia(mqFullscreen).matches) {
    displayPwa = true;
  }
  return displayPwa;
}

export function isWebView() {
  let displayWebView = false;
  displayWebView = navigator.userAgent
    .toLocaleLowerCase()
    .includes("sooft-view");
  return displayWebView;
}

export function goToFullscreen() {
  const element = document.body;
  if (element.requestFullscreen) element.requestFullscreen();
  else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
  else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
  else if (element.msRequestFullscreen) element.msRequestFullscreen();
}

export function randomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getImageFormatedUrl(image, width = 370) {
  if (process.env.VUE_APP_ENVIROMENT == "production") {
    return process.env.VUE_APP_SERVER_IMAGE + "/" + width + "x/" + image;
  } else {
    return image;
  }
}
export async function getByUserId(id) {
  return new Promise((resolve) => {
    axios.get(process.env.VUE_APP_USER_MAIN_URI+'/profile/get/'+id)
    .then(function(response) {
      resolve(response.data);
    }).catch(function(){
      resolve(false);
    });
  });
}

export function getAvatarUrl(img = null) {
  let image = (img) ? img : store.state.user.Usu_Imagen;
  if (
    image == undefined ||
    image == ""
  ) {
    return null;
  }
  if (image.includes("file/")) {
    if (process.env.VUE_APP_ENVIROMENT == "production") {
      return (
        process.env.VUE_APP_SERVER_IMAGE +
        "/370x/" +
        process.env.VUE_APP_USER_MAIN_URI +
        image
      );
    } else {
      return process.env.VUE_APP_USER_MAIN_URI + image;
    }
  } else {
    return process.env.VUE_APP_URL_YO + "/" + image;
  }
}

export function getInitials(name = null, ape = null) {
  if(name == null || ape == null){
    return '';
  }
  return name.charAt(0) + ape.charAt(0);
}

export function getInitialsUser(name = null, ape = null) {
  if((name == null && ape == null ) && (store.state.user.Usu_Nombre == undefined
    || store.state.user.Usu_Apellido == undefined
    || store.state.user.Usu_Apellido == null
    || store.state.user.Usu_Nombre == null
    || store.state.user.Usu_Apellido == ''
    || store.state.user.Usu_Nombre == '') ){
    return '';
  }
  return store.state.user.Usu_Nombre != undefined
    ? store.state.user.Usu_Nombre.charAt(0) +
        store.state.user.Usu_Apellido.charAt(0)
    : "";
}

export async function isUrlFound(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-cache",
    });
    return response.status === 200;
  } catch (error) {
    // console.log(error);
    return false;
  }
}

export function getColor(type = 'buttons', isNot=undefined) {
  let metadataJson =
    store.state.user.Emp_Data.Metadata != undefined
      && store.state.user.Emp_Data.Metadata.colors != undefined
      ? store.state.user.Emp_Data.Metadata : null;

    if(metadataJson == null){
      if(store.state.user.Emp_Data.Metadata == undefined){
        return isNot;//default vuefity
      }
      try {
        metadataJson = JSON.parse(store.state.user.Emp_Data.Metadata);
      } catch (e) {
        return isNot;//default vuefity
      }
    }
    var colors = metadataJson.colors;
    if(!colors){
      return isNot
    }
    return colors[type] != undefined ? colors[type] : isNot;
}

export async function getLupa() {
  let metadataJson =
    store.state.user.Emp_Data.Metadata != undefined && store.state.user.Emp_Data.Metadata.subdomain != undefined ? store.state.user.Emp_Data.Metadata : null;

  if(metadataJson == null){
    if(store.state.user.Emp_Data.Metadata == undefined){
      return "/img/install/lupa.png";
    }
    try {
      metadataJson = JSON.parse(store.state.user.Emp_Data.Metadata);
    } catch (e) {
      console.log(e);
    }
  }

  try {
    const exist = await isUrlFound(
      "/manifests/" + metadataJson.subdomain + "/img/install/lupa.png"
    );
    if (!exist) {
      return "/img/install/lupa.png";
    }
  } catch (e) {
    return "/img/install/lupa.png";
  }

  return "/manifests/" + metadataJson.subdomain + "/img/install/lupa.png";
}

export function clearEscape(text) {
  if (text && text == "") {
    return "";
  }
  let json = "";
  try {
    json = JSON.parse(JSON.stringify(text))
      .replace(/\/\/\/\//g, "")
      .replace(/\\/g, "")
      .replace(/absolute/g, "initial")
      .replace(/flex/g, "")
      .replace(/width:/g, "width:100%;");
  } catch (e) {
    return "";
  }
  return json;
}

export function coolFormateDate(date) {
  if (date != undefined) {
    if (date.lastIndexOf("T") > -1) date.replace("T", " ");
    if (date.length > 19) date.substring(0, 19);

    var fec = date.substring(0, 10);
    var separator = "/";
    if (fec.indexOf("-") > -1) separator = "-";

    var hour = date.substring(11, 19);

    var [year, month, day] = fec.split(separator);

    if (year.length == 2) {
      var aux = year;

      year = day;
      day = aux;
    }

    var fec_publish = `${year}-${month}-${day} ${hour}`;
    return moment(fec_publish, "YYYY-MM-DD h:mm:ss").fromNow();
  } else return "";
}

export function FormatDate(format, date) {
  var fec = date.substring(0, 10);
  var separator = "/",
    formatSeparator = "/";
  if (fec.indexOf("-") > -1) separator = "-";
  if (format.indexOf("-") > -1) formatSeparator = "-";
  if (!date) return null;
  const [year, month, day] = fec.split(separator);
  var formated = `${day}${formatSeparator}${month}${formatSeparator}${year}`;

  if (format === "yyyy-mm-dd" || format === "yyyy/mm/dd") {
    formated = `${year}${formatSeparator}${month}${formatSeparator}${day}`;
  }

  if (format === "dd-mm-yyyy" || format === "dd/mm/yyyy") {
    formated = `${day}${formatSeparator}${month}${formatSeparator}${year}`;
  }

  return formated;
}

export function FormateDateTime(date) {
  var fec = date.substring(0, 10);
  var separator = "/";
  if (fec.indexOf("-") > -1) separator = "-";

  var [year, month, day] = fec.split(separator);

  var aux;
  if (year.length == 2) {
    aux = year;
    year = day;
    day = aux;
  }

  var hour = date.substring(11, 16);

  return `${day}/${month}/${year} ${hour} hs.`;
}

export function splitTextView(text, size = 40) {
  if (text.length > size) {
    return { text: text, textSplit: text.slice(0, size - 1) + "…" };
  }
  return { text: text, textSplit: text };
}

export function randName() {
  return Math.random().toString(36).substring(7);
}

export function imageEmp(emp = null) {
  if (emp == null) {
    emp = store.state.user.Emp_Data;
  }
  if (emp) {
    if (emp.Emp_Imagen == undefined) {
      return null;
    }
    return process.env.VUE_APP_URL_YO + "/" + emp.Emp_Imagen;
  }
  return null;
}

export function generateUrlImage(Emp_Id, Desc_ImagenPath) {
  //Cache y redimencion en produccion
  if (process.env.VUE_APP_ENVIROMENT == "production") {
    return (
      process.env.VUE_APP_SERVER_IMAGE +
      "/670x/" +
      process.env.VUE_APP_IMAGE_URL_YO +
      "/" +
      Emp_Id +
      "/" +
      Desc_ImagenPath
    );
  }

  return (
    process.env.VUE_APP_IMAGE_URL_YO + "/" + Emp_Id + "/" + Desc_ImagenPath
  );
}

export function parseDate(date, format = 'DD/MM/YY HH:mm', withHs = true){
   //2022-06-02T19:13:07.049Z
   date.replace('T', ' ');
   date.replace('Z', '');
   return moment(date, 'YYYY-MM-DD HH:mm:ss').add(2, 'hours').format(format) + `${(withHs) ? ' hs.' : ''}`;
}

export function parseHour(date){
  //2022-06-02T19:13:07.049Z
  date.replace('T', ' ');
  date.replace('Z', '');
  return this.$moment(date, 'YYYY-MM-DD HH:mm:ss').add(2, 'hours').format('HH:mm') + ' hs.';
}
