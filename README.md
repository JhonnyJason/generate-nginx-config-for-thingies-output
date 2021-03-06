# generate-nginx-config-for-thingies - Small cli which generates the appropriate nginx configuration files which will then later reside in /etc/nginx/sites-enabled directory.

# Why?
The toolset for the machine thingy requires such a tool.

# What?
generate-nginx-config-for-thingies - cli taking a config file from a machine-thingy then generating the appropriate nginx server configuration files for each thingy.

Considers a potential port to the outside, DNS names, proxy_pass to service-thingies either as unix socket or tcp socket.

# How?
Requirements
------------
* [Node.js installed](https://nodejs.org/) ^^nona

Installation
------------

Current git version
``` sh
$ npm install git+https://github.com/JhonnyJason/generate-nginx-config-for-thingies-output.git
```
Npm Registry
``` sh
$ npm install generate-nginx-config-for-thingies
```

Usage
-----
Call the script by it's name :-) first argument is the path to the machine-config.js file.
The second argument is the directory where we should store the generated files.

Both arguments are required.
```
$ generate-nginx-config-for-thingies --help

  Usage
      $ generate-nginx-config-for-thingies <arg1> <arg2>
    
  Options
      required:
      arg1, --machine-config <machine-config>, -c <machine-config>
          path to file which if the machine-config
      arg2, --output-directory <path/to/dir>, -o <path/to/dir>
          path of directory where the generated config files should be stored
    
  TO NOTE:
      The flags will overwrite the flagless argument.

  Examples
      $ generate-nginx-config-for-thingies  machine-config.js ../sites-enabled
      ...

```

machine-config
-----

To be interpreted correctly the machine-config file must meet following requirements:

- hold an array `thingies`
- each thingy may have:
    - `homeUser` - required - used for naming
    - `type` - processed are "service" or "website"
    - `searchIndexing` - optional - if undefined or false will add x-robots-tag to not index
    - `dnsNames` - optional - sometimes very reasonable^^
    - `socket` - optional - use proxy_pass to unix-socket
    - `broadCORS` - optional - add headers for wide open CORS with credentials allowed
    - `upgradeWebsocket` - optional adds upgrade headers to use Websockets
    - `outsidePort` - nginx listens on this port then default is port 80
    - `port` - optional(required if we donot use a unix-socket) - proxy_pass to localhost:port

```javascript
module.exports = {
    thingies = [
        {
            homeUser: "citysearch-socket",
            type:"service",
            socket: true,
            dnsNames: ["citysearch.weblenny.at"],
            outsidePort: 65531
        },
        {
            homeUser: "weblenny-homepage",
            type:"website",
            searchIndexing: true,
            dnsNames: ["www.weblenny.at", "weblenny.at"]
        },
        {
            homeUser: "citysearch",
            type:"service",
            port: "3002",
            broadCORS: true,
            upgradeWebsocket: true,
            dnsNames: ["citysearch.weblenny.at"]
        },
        ...
    ]
    ...
}
```


Result
-----
Produced Config Files:
- File: citysearch-socket
```
server {
    listen 65530;
    listen [::]:65530;

    server_name citysearch.weblenny.at;

###### Tell the Robots: No Indexing!
    add_header  X-Robots-Tag "noindex, nofollow, nosnippet, noarchive";

###### Handling of all regular requests - SocketService
    location / {
        limit_except POST { deny all; }

########## ProxyPass to service at unix Socket
        proxy_pass http://unix:/run/citysearch-socket.sk;

    }

}
```

- File: weblenny-homepage
```
server {
    listen 80;
    listen [::]:80;

    server_name www.weblenny.at weblenny.at;

###### Our document-root
    root /srv/http/weblenny-homepage;

###### Removing .html extension
    if ($request_uri ~ ^/(.*)\.html$) { return 301 /$1; }

###### Handling of all regular requests - Website
    location / {
        limit_except GET { deny all; }
        gzip_static on;
        try_files $uri $uri.html $uri/ =404;
    }

}
```

- File: citysearch
```
server {
    listen 80;
    listen [::]:80;

    server_name citysearch.weblenny.at;

###### Tell the Robots: No Indexing!
    add_header  X-Robots-Tag "noindex, nofollow, nosnippet, noarchive";

###### Allow all CORS requests
    add_header 'Access-Control-Allow-Origin' "$http_origin" always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With,X-Token-Auth,X-Mx-ReqToken,X-Requested-With';
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';

    if ($request_method = 'OPTIONS') { rewrite ^ /.options last; }

###### handle options requests here
    location /.options {
        limit_except OPTIONS { deny all; }
        add_header 'Access-Control-Allow-Origin' "$http_origin" always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With,X-Token-Auth,X-Mx-ReqToken,X-Requested-With';
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }

###### Handling of all regular requests - PortService
    location / {
        limit_except POST { deny all; }

########## Upgrade connection for websockets
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_read_timeout 2h;
        proxy_send_timeout 2h;

########## ProxyPass to service at port
        proxy_pass http://localhost:3002;

    }

}
```
- and the others^^
---

# License

## The Unlicense JhonnyJason style

- Information has no ownership.
- Information only has memory to reside in and relations to be meaningful.
- Information cannot be stolen. Only shared or destroyed.

And you whish it has been shared before it is destroyed.

The one claiming copyright or intellectual property either is really evil or probably has some insecurity issues which makes him blind to the fact that he also just connected information which was free available to him.

The value is not in him who "created" the information the value is what is being done with the information.
So the restriction and friction of the informations' usage is exclusively reducing value overall.

The only preceived "value" gained due to restriction is actually very similar to the concept of blackmail (power gradient, control and dependency).

The real problems to solve are all in the "reward/credit" system and not the information distribution. Too much value is wasted because of not solving the right problem.

I can only contribute in that way - none of the information is "mine" everything I "learned" I actually also copied.
I only connect things to have something I feel is missing and share what I consider useful. So please use it without any second thought and please also share whatever could be useful for others. 

I also could give credits to all my sources - instead I use the freedom and moment of creativity which lives therein to declare my opinion on the situation. 

*Unity through Intelligence.*

We cannot subordinate us to the suboptimal dynamic we are spawned in, just because power is actually driving all things around us.
In the end a distributed network of intelligence where all information is transparently shared in the way that everyone has direct access to what he needs right now is more powerful than any brute power lever.

The same for our programs as for us.

It also is peaceful, helpful, friendly - decent. How it should be, because it's the most optimal solution for us human beings to learn, to connect to develop and evolve - not being excluded, let hanging and destroy.

If we really manage to build an real AI which is far superior to us it will unify with this network of intelligence.
We never have to fear superior intelligence, because it's just the better engine connecting information to be most understandable/usable for the other part of the intelligence network.

The only thing to fear is a disconnected unit without a sufficient network of intelligence on its own, filled with fear, hate or hunger while being very powerful. That unit needs to learn and connect to develop and evolve then.

We can always just give information and hints :-) The unit needs to learn by and connect itself.

Have a nice day! :D