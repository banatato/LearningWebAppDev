#!/usr/bin/env node

"use strict";

var http = require("http"),
    querystring = require("querystring"),
    child_process = require("child_process");

function frontPage(req, res) {
    res.writeHead(200, {
        "Content-Type": "text/html"
    });

    if (req.url === "/style.css") {
        writeCSS(res);
    } else {
        var title = "Nudge - Web Interface for Git Push";

        beginPage(res, title);
        writeHeading(res, "h1", title);

        if (req.method === "POST" && req.url === "/push") {
            gitPush(req, res);
        } else {
            gitStatus(res);
        }
    }
}

function navClass(res, nClass) {
    var divClass = "container";
    var data = "";
    var adata = "navbar-brand"
    res.write("<nav class='" + nClass + "'>\n");
    writePre(res, divClass, data);

    res.write("<a class='" + adata + "'> STYLE the GitStatus Page\n");
    res.write("</nav>\n");
}

function div_func(res, dClass) {
    res.write("<div class='" + dClass + "'>\n");
}

function div_func_end(res){
    res.write("</div>\n");
}

function writeCSS(res) {
    res.writeHead(200, {
        "Content-Type": "text/css"
    });

    res.write("/* style.css - this space intentionally left blank */");
    res.end();
}

function beginPage(res, title) {
    var nClass = "navbar navbar-inverse navbar-fixed-top";
    res.write("<!DOCTYPE html>\n");
    res.write("<html lang='en'>\n");
    res.write("<head>\n");
    res.write("<meta charset='utf-8'>\n");
    res.write("<title>"+ title + "</title>\n");
    res.write("<link rel='stylesheet' href='style.css' type='text/css'>\n");
    res.write("<link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css' type='text/css'>\n");
    res.write("<link rel='stylesheet' href='http://getbootstrap.com/examples/jumbotron/jumbotron.css' type='text/css'>\n");
    res.write("</head>\n");
    res.write("<body>\n");

    navClass(res, nClass);
}

function gitStatus(res) {
    child_process.exec("git status", function(err, stdout, stderr) {
        if (err) {
            writeHeading(res, "h2", "Error retrieving status");
            writePre(res, "error", stderr);
            endPage(res);
        } else {
            var dClass = "container";
            var dClass1 = "jumbotron";
            div_func(res, dClass);
            div_func(res, dClass1);
            writeHeading(res, "h2", "Git Status");
            writePre(res, "status", stdout);
            gitBranch(res);
            div_func_end(res);
            div_func_end(res);
        }
    });
}


function writeHeading(res, tag, title) {
    res.write("<" + tag + ">" + title + "</" + tag + ">\n");
}

function writePre(res, divClass, data) {
    var escaped = data.replace(/</, "&lt;").
                       replace(/>/, "&gt;");

    res.write("<div class='" + divClass + "_div'>\n");
    res.write("<pre>");
    res.write(escaped);
    res.write("</pre>\n");
    res.write("</div>\n");
}


function gitBranch(res) {
    child_process.exec("git branch", function(err, stdout, stderr) {
        if (err) {
            writeHeading(res, "h2", "Error listing branches");
            writePre(res, "error", stderr);
            endPage(res);
        } else {
            var output = stdout.toString(),
                branches = output.split(/\n/);

            beginForm(res);
            beginSelect(res, "branch");

            branches.forEach(function(branch) {
                var branchName = branch.replace(/^\s*\*?\s*/, "").
                                        replace(/\s*$/, "");

                if (branchName) {
                    writeOption(res, branchName);
                }
            });

            endSelect(res);
            gitRemote(res);
        }
    });
}

function beginForm(res) {
    res.write("<form method='POST' action='/push'>\n");
}

function endForm(res) {
    res.write("<input type='submit' value='Push'>\n");
    res.write("</form>\n");
}

function beginSelect(res, what) {
    res.write("<div class='" + what + "_div'>\n");
    res.write("<label for='" + what + "_select'>" + capitalize(what) + "</label>\n");
    res.write("<select id='" + what + "_select' name='" + what + "'>\n");
}

function endSelect(res) {
    res.write("</select>\n");
    res.write("</div>\n");
}

function writeOption(res, option) {
    res.write("<option value='" + option + "'>" + option + "</option>\n");
}

function endPage(res) {
    res.write("</body>\n");
    res.write("</html>\n");
    res.end();
}

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

function gitRemote(res) {
    child_process.exec("git remote", function(err, stdout, stderr) {
        if (err) {
            writeHeading(res, "h2", "Error listing remotes");
            writePre(res, "error", stderr);
            endPage(res);
        } else {
            var output = stdout.toString(),
                remotes = output.split(/\n/);

            beginSelect(res, "remote");

            remotes.forEach(function(remoteName) {
                if (remoteName) {
                    writeOption(res, remoteName);
                }
            });

            endSelect(res);
            endForm(res);
            endPage(res);
        }
    });
}

function gitPush(req, res) {
    var body = "";

    req.on("data", function(chunk) {
        body += chunk;
    });

    req.on("end", function () {
        var form = querystring.parse(body);

        child_process.exec("git push " + form.remote + " " + form.branch, function(err, stdout, stderr) {
            if (err) {
                writeHeading(res, "h2", "Error pushing repository");
                writePre(res, "error", stderr);
            } else {
                writeHeading(res, "h2", "Git Push");
                writePre(res, "push", stdout);
            }
            gitStatus(res);
        });
    });
}



var server = http.createServer(frontPage);
server.listen();
var address = server.address();
console.log("nudge is listening at http://localhost:" + address.port + "/");
