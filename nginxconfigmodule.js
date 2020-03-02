// Generated by CoffeeScript 2.5.1
(function() {
  var CORSSection, c, errLog, fs, listenLine, locationSection, log, nginxconfigmodule, noIndexSection, pathHandler, portServiceLocationSection, proxyPassPortSection, proxyPassSocketSocket, removeHTMLExtensionSection, serverNameLine, socketServiceLocationSection, successLog, websiteLocationSection, websocketSection;

  nginxconfigmodule = {
    name: "nginxconfigmodule"
  };

  //###########################################################
  //region logPrintFunctions
  log = function(arg) {
    if (allModules.debugmodule.modulesToDebug["nginxconfigmodule"] != null) {
      console.log("[nginxconfigmodule]: " + arg);
    }
  };

  errLog = function(arg) {
    return console.log(c.red(arg));
  };

  successLog = function(arg) {
    return console.log(c.green(arg));
  };

  //endregion

  //###########################################################
  fs = require("fs").promises;

  c = require("chalk");

  //###########################################################
  pathHandler = null;

  //###########################################################
  nginxconfigmodule.initialize = function() {
    log("nginxconfigmodule.initialize");
    pathHandler = allModules.pathhandlermodule;
  };

  //###########################################################
  //region generateServerSectionLines
  listenLine = function(thingy) {
    var result;
    log("listenLine");
    result = "";
    if (thingy.outsidePort && thingy.plainHTTP) {
      result += "    listen " + thingy.outsidePort + ";\n";
    } else if (thingy.outsidePort) {
      result += "    listen " + (thingy.outsidePort - 1) + ";\n";
    } else {
      result += "    listen 80;\n";
      result += "    listen [::]:80;\n";
    }
    result += "\n";
    return result;
  };

  serverNameLine = function(thingy) {
    var i, len, name, ref, result;
    log("serverNameLine");
    result = "";
    if ((thingy.dnsNames != null) && thingy.dnsNames.length > 0) {
      result += "    server_name";
      ref = thingy.dnsNames;
      for (i = 0, len = ref.length; i < len; i++) {
        name = ref[i];
        result += " " + name;
      }
      result += ";\n\n";
    }
    return result;
  };

  locationSection = function(thingy) {
    log("locationSection");
    if (thingy.type === "website") {
      return websiteLocationSection(thingy);
    }
    if (thingy.type === "service" && thingy.socket) {
      return socketServiceLocationSection(thingy);
    }
    if (thingy.type === "service" && thingy.port) {
      return portServiceLocationSection(thingy);
    }
    if (thingy.type === "service") {
      throw new Error("Service has neither port nor socket defined!");
    }
    return "";
  };

  //endregion

  //###########################################################
  //region locationSections
  websiteLocationSection = function(thingy) {
    var result;
    log("websiteLocationSection");
    if (!thingy.homeUser) {
      throw new Error("No homeUser was defined!");
    }
    result = "    location / {\n";
    result += removeHTMLExtensionSection();
    result += noIndexSection(thingy.searchIndexing);
    result += "\n        gzip_static on;\n";
    result += "        limit_except GET { deny all; }\n";
    result += "        root /srv/http/" + thingy.homeUser + ";\n";
    result += "        index index.html;\n";
    result += "\n    }\n\n";
    return result;
  };

  portServiceLocationSection = function(thingy) {
    var result;
    log("portServiceLocationSection");
    if (!thingy.port) {
      throw new Error("No port was defined!");
    }
    result = "    location / {\n";
    result += "        limit_except GET POST OPTIONS { deny all; }\n";
    result += noIndexSection(thingy.searchIndexing);
    result += CORSSection(thingy.broadCORS);
    result += websocketSection(thingy.upgradeWebsocket);
    result += proxyPassPortSection(thingy.port);
    result += "\n    }\n\n";
    return result;
  };

  socketServiceLocationSection = function(thingy) {
    var result;
    log("socketServiceLocationSection");
    if (!thingy.homeUser) {
      throw new Error("No homeUser was defined!");
    }
    result = "    location / {\n";
    result += "        limit_except GET POST OPTIONS { deny all; }\n";
    result += noIndexSection(thingy.searchIndexing);
    result += CORSSection(thingy.broadCORS);
    result += websocketSection(thingy.upgradeWebsocket);
    result += proxyPassSocketSocket(thingy.homeUser);
    result += "\n    }\n\n";
    return result;
  };

  //###########################################################
  //region individualSections
  noIndexSection = function(searchIndexing) {
    if (searchIndexing) {
      return "";
    }
    return `
########## Tell the Robots: No Indexing!
        add_header  X-Robots-Tag "noindex, nofollow, nosnippet, noarchive";
`;
  };

  removeHTMLExtensionSection = function() {
    return `
########## Removing .html extension
        if ($request_uri ~ ^/(.*)\\.html$) {
            return 301 /$1;
        }
        try_files $uri $uri.html $uri/ =404;
`;
  };

  proxyPassPortSection = function(port) {
    return `
########## ProxyPass to service at port
        proxy_pass http://localhost:${port};
`;
  };

  proxyPassSocketSocket = function(homeUser) {
    return `
########## ProxyPass to service at unix Socket
        proxy_pass http://unix:/run/${homeUser}.sk;
`;
  };

  CORSSection = function(broadCORS) {
    if (!broadCORS) {
      return "";
    }
    return `
########## Allow all CORS requests
        add_header 'Access-Control-Allow-Origin' "$http_origin" always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With,X-Token-Auth,X-Mx-ReqToken,X-Requested-With';
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';

        if ($request_method = 'OPTIONS') {

            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
`;
  };

  websocketSection = function(upgradeWebsocket) {
    if (!upgradeWebsocket) {
      return "";
    }
    return `
########## Upgrade connection for websockets
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_read_timeout 2h;
        proxy_send_timeout 2h;
`;
  };

  //endregion

  //endregion

  //###########################################################
  nginxconfigmodule.generateForThingy = async function(thingy) {
    var configPath, configString, err, errorMessage;
    log("nginxconfigmodule.generateForThingy");
    // log "\n" + JSON.stringify(thingy, null, 2)
    if (thingy.type !== "service" && thingy.type !== "website") {
      return;
    }
    try {
      configString = "server {\n";
      configString += listenLine(thingy);
      configString += serverNameLine(thingy);
      configString += locationSection(thingy);
      configString += "}\n";
      configPath = pathHandler.getConfigOutputPath(thingy.homeUser);
      log("write to: " + configPath);
      await fs.writeFile(configPath, configString);
      return successLog(thingy.homeUser + " - nginx-config generated");
    } catch (error) {
      err = error;
      errorMessage = thingy.homeUser + " - could not generate nginx-config";
      errorMessage += "\nReason: " + err;
      return errLog(errorMessage);
    }
  };

  module.exports = nginxconfigmodule;

}).call(this);
