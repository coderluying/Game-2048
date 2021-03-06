/**
 * Created by FF on 2017/6/10.
 */

//init the board

/**
 * Created by FF on 2017/6/13.
 */
var n = 4, M = new MatrixTransform(n);

var ai = {weights: [1, 1], depth: 1}; // depth=1 by default, but we adjust it on every prediction according to the number of free tiles

var snake= [[10,8,7,6.5],
    [.5,.7,1,3],
    [-.5,-1.5,-1.8,-2],
    [-3.8,-3.7,-3.5,-3]];
snake=snake.map(function(a){return a.map(Math.exp)});



function run(ai) {
    var p;
    while ((p = predict(ai)) != null) {
        move(p, ai);
    }
    //console.log(ai.grid , maxValue(ai.grid))
    ai.maxValue = maxValue(ai.grid);
    console.log(ai)
}

function initialize(ai) {
    ai.grid = [];
    for (var i = 0; i < n; i++) {
        ai.grid[i] = [];
        for (var j = 0; j < n; j++) {
            ai.grid[i][j] = 0;
        }
    }
    rand(ai.grid);
    rand(ai.grid);
   convertForAI();
    copyAtoB(ai.grid,grid);
    ai.steps = 0;
}

function move(p, ai) { //0:up, 1:right, 2:down, 3:left
    var newgrid = mv(p, ai.grid);
    if (!equal(newgrid, ai.grid)) {
        //console.log(stats(newgrid, ai.grid))
        ai.grid = newgrid;
        try {
            rand(ai.grid);
            ai.steps++;
        } catch (e) {
            console.log('no room', e)
        }
    }
}



function predict(ai) {
    var free = freeCells(ai.grid);
    ai.depth = free > 7 ? 1 : (free > 4 ? 2 : 3);
    var root = {path: [],prob: 1,grid: ai.grid,children: []};
    var x = expandMove(root, ai);
    //console.log("number of leaves", x)
    //console.log("number of leaves2", countLeaves(root))
    if (!root.children.length) return null;
    var values = root.children.map(expectimax);
    var mx = max(values);
    return root.children[mx[1]].path[0];

}

function countLeaves(node) {
    var x = 0;
    if (!node.children.length) return 1;
    for (var n in node.children)
        x += countLeaves(n);
    return x;
}

function expectimax(node) {
    if (!node.children.length) {
        return node.score
    } else {
        var values = node.children.map(expectimax);
        if (node.prob) { //we are at a max node
            return Math.max.apply(null, values)
        } else { // we are at a random node
            var avg = 0;
            for (var i = 0; i < values.length; i++)
                avg += node.children[i].prob * values[i]
            return avg / (values.length / 2)
        }
    }
}

function expandRandom(node, ai) {
    var x = 0;
    for (var i = 0; i < node.grid.length; i++)
        for (var j = 0; j < node.grid.length; j++)
            if (!node.grid[i][j]) {
                var grid2 = M.copy(node.grid),
                    grid4 = M.copy(node.grid);
                grid2[i][j] = 2;
                grid4[i][j] = 4;
                var child2 = {grid: grid2,prob: .9,path: node.path,children: []};
                var child4 = {grid: grid4,prob: .1,path: node.path,children: []};
                node.children.push(child2);
                node.children.push(child4);
                x += expandMove(child2, ai);
                x += expandMove(child4, ai);
            }
    return x;
}

function expandMove(node, ai) { // node={grid,path,score}
    var isLeaf = true,
        x = 0;
    if (node.path.length < ai.depth) {
        for (var move in [0, 1, 2, 3]) {
            var grid = mv(move, node.grid);
            if (!equal(grid, node.grid)) {
                isLeaf = false;
                var child = {grid: grid,path: node.path.concat([move]),children: []};
                node.children.push(child);
                x += expandRandom(child, ai);
            }
        }
    }
    if (isLeaf) node.score = dot(ai.weights, stats(node.grid));
    return isLeaf ? 1 : x;
}
function aiStop()
{
    ai.running=false;
}

function updateHint()
{
    var node=document.getElementById("direction");
    var p=predict(ai);
    var dre="";


    var chose= parseInt(p);

    switch (chose) {
        case 0:dre="Up";
            break;
        case 1:dre="Right";
            break;
        case 2:dre="Down";
            break;
        case 3:dre="Left";
            break;
        default :dre="No Hint";
            break;
    }

    node.innerHTML=dre;
}
function runAI() {
    copyAtoB(grid,ai.grid);



    var p = predict(ai);
    if (p != null&&ai.running!=false) {
        move(p, ai);
        copyAtoB(ai.grid,grid);
        convertForAI();
        click();
        requestAnimationFrame(runAI);
    }
}
var map = {
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
};

function stats(grid, previousGrid) {

    var free = freeCells(grid);

    var c = dot2(grid, snake);

    return [c, free * free];
}

function dist2(a, b) { //squared 2D distance
    return Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)
}

function dot(a, b) {
    var r = 0;
    for (var i = 0; i < a.length; i++)
        r += a[i] * b[i];
    return r
}

function dot2(a, b) {
    var r = 0;
    for (var i = 0; i < a.length; i++)
        for (var j = 0; j < a[0].length; j++)
            r += a[i][j] * b[i][j]
    return r;
}

function product(a) {
    return a.reduce(function(v, x) {
        return v * x
    }, 1)
}

function maxValue(grid) {
    return Math.max.apply(null, grid.map(function(a) {
        return Math.max.apply(null, a)
    }));
}

function freeCells(grid) {
    return grid.reduce(function(v, a) {
        return v + a.reduce(function(t, x) {
                return t + (x == 0)
            }, 0)
    }, 0)
}

function max(arr) { // return [value, index] of the max
    var m = [-Infinity, null];
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] > m[0]) m = [arr[i], i];
    }
    return m
}

function min(arr) { // return [value, index] of the min
    var m = [Infinity, null];
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] < m[0]) m = [arr[i], i];
    }
    return m;
}

function maxScore(nodes) {
    var min = {
        score: -Infinity,
        path: []
    };
    for (var node in nodes) {
        if (node.score > min.score) min = node;
    }
    return min;
}


function mv(k, grid) {
    var tgrid = M.itransform(k, grid);
    for (var i = 0; i < tgrid.length; i++) {
        var a = tgrid[i];
        for (var j = 0, jj = 0; j < a.length; j++)
            if (a[j]) a[jj++] = (j < a.length - 1 && a[j] == a[j + 1]) ? 2 * a[j++] : a[j];
        for (; jj < a.length; jj++)
            a[jj] = 0;
    }
    return M.transform(k, tgrid);
}

function rand(grid) {
    var r = Math.floor(Math.random() * freeCells(grid)),
        _r = 0;
    for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid.length; j++) {
            if (!grid[i][j]) {
                if (_r == r) {
                    grid[i][j] = Math.random() < .9 ? 2 : 4
                }
                _r++;
            }
        }
    }
}

function equal(grid1, grid2) {
    for (var i = 0; i < grid1.length; i++)
        for (var j = 0; j < grid1.length; j++)
            if (grid1[i][j] != grid2[i][j]) return false;
    return true;
}

function conv44valid(a, b) {
    var r = 0;
    for (var i = 0; i < 4; i++)
        for (var j = 0; j < 4; j++)
            r += a[i][j] * b[3 - i][3 - j];
    return r;
}

function MatrixTransform(n) {
    var g = [],
        ig = [];
    for (var i = 0; i < n; i++) {
        g[i] = [];
        ig[i] = [];
        for (var j = 0; j < n; j++) {
            g[i][j] = [[j, i],[i, n-1-j],[j, n-1-i],[i, j]]; // transformation matrix in the 4 directions g[i][j] = [up, right, down, left]
            ig[i][j] = [[j, i],[i, n-1-j],[n-1-j, i],[i, j]]; // the inverse tranformations
        }
    }
    this.transform = function(k, grid) {
        return this.transformer(k, grid, g);
    }
    this.itransform = function(k, grid) { // inverse transform
        return this.transformer(k, grid, ig);
    }
    this.transformer = function(k, grid, mat) {
        var newgrid = [];
        for (var i = 0; i < grid.length; i++) {
            newgrid[i] = [];
            for (var j = 0; j < grid.length; j++)
                newgrid[i][j] = grid[mat[i][j][k][0]][mat[i][j][k][1]];
        }
        return newgrid;
    }
    this.copy = function(grid) {
        return this.transform(3, grid)
    }
}



































var maxScore = 0;
var score = 0;
var grid;

var nodes;
function test()
{

}
function baseInitAI()
{
    initialize(ai);
    copyAtoB(ai.grid,grid);
    ai.running=false;

}
function aiPlay()
{
    ai.running=true;

    runAI();

}


function init() {
    var node;
    for (var i = 0; i < 16; i++) {
         node= document.createElement("div");
        node.class = "blank";
        node.setAttribute("class", "blank");
        var testNode = document.createTextNode("");
        node.appendChild(testNode);
        var board = document.getElementsByClassName("board");
        board[0].appendChild(node);
    }

    nodes= document.getElementsByClassName("blank");
    //create baord
    grid=new Array();
    for(var i=0;i<4;i++)
    { grid[i]=new Array();
        for(var j=0;j<4;j++) {
            grid[i][j] = 0;
        }
    }

    //initBoard
    for(var i=0;i<2;i++) {
        var arr = Random();
        //color board
        nodes[arr[0] * 4 + arr[1]].htmlText = arr[2];
        var test = document.createTextNode(arr[2]);
        nodes[arr[0] * 4 + arr[1]].appendChild(test);
        grid[arr[0]][arr[1]] = arr[2];
    }
    ai.grid=grid;
    console.log("init sucess");
}

var bigOne=0;




var myvar;

function play()
{
    myvar=setInterval(function(){
        nextRount();
    },50);
}

function nextRount() {
var end=false;
    var chose = robotPlay();
    switch (chose) {
        case "up":mUp();
            break;
        case "down":mDown();
            break;
        case "left":mLeft();
            break;
        case "right":mRight();
            break;
        default :end=true;
            break;
}
    if(end==true)
    { alert("game over!!!!!!");
    clearInterval(myvar);}
return end;
}


function copyAtoB(a,b)
{
    for(var i=0;i< a.length;i++)
        for(var j=0;j< a.length;j++)
          b[i][j]=a[i][j];
}

function tc()
{
    var c=countPoint();
    alert(c);
}
function countPoint()
{
    var p=0.0;
    p=countMoon()*8.0+getMax()*1.0+countEmpty()*2.7+countSolo()*1.0;
return p;
}
function countMoon()
{
    var moon=0;
    var line=new Array();
    var row=new Array();

    for(var i=0;i<grid.length;i++) {
        line[i]=new Array();
        for (var j = 0; j < grid.length; j++) {
           if(grid[i][j]!=0)
         line[i].push(grid[i][j]);
        }
    }

    for(var j=0;j<grid.length;j++) {
        row[j]=new Array();
        for (var i = 0; i < grid.length; i++) {
            if(grid[i][j]!=0)
                row[j].push(grid[i][j]);
        }
    }

    for(var k=0;k<line.length;k++)
    {
        if(isMoon(line[k])==true)
          moon++;
    }
    for(var k=0;k<row.length;k++) {
        if (isMoon(row[k]) == true)
            moon++;
    }

return moon;
}

function countSolo()
{
var csolo=0;
return csolo;

}
function countEmpty()
{
    var cempty=0;
    for(var i=0;i<grid.length;i++) {
        for (var j = 0; j < grid.length; j++) {
            if(grid[i][j]==0)
               cempty++;
        }
    }
    return cempty;
}


function achivegold()
{
    var a=0;
    for(var i=0;i<grid.length;i++)
      for(var j=0;j<grid.length;j++)
        if(grid[i][j]>bigOne&&grid[i][j]>=32) {

                alert("amazing!!");

                bigOne=grid[i][j];
            if(bigOne==512)
            alert("torget is one the road body,keep trying!!!!!!!");

            if(bigOne==2048)
            alert("wow!!!!!!!!2048 you got it");
                break;
        }
}



function updaeScoreBoard()
{
    var score=getScore();
   var sc= document.getElementById("point");
    sc.innerHTML=score;


    for(var i=0;i<grid.length;i++)
        for(var j=0;j<grid.length;j++)
            if(grid[i][j]>bigOne) {

                bigOne=grid[i][j];

            }

    var maxScore=getMax();
    var  msc =document.getElementById("maxpoint");
    msc.innerHTML=maxScore;

}

function click()
{var audio = document.getElementById("auto");
    audio.currentTime = 0;
    audio.play();
}
function mUp() {
    click();
    var flag;
    flag = moveUp(grid);


    convert();


    //createNewOne

    if (flag == true) {

    var arr = Random();
    nodes[arr[0] * 4 + arr[1]].htmlText = arr[2];
    var test = document.createTextNode(arr[2]);
    nodes[arr[0] * 4 + arr[1]].appendChild(test);
    grid[arr[0]][arr[1]] = arr[2];

    //cionvert
    convert();
    }
    copyAtoB(grid,ai.grid);
    achivegold();
    updaeScoreBoard();
    updateHint();

}
function mDown() {
    click();
    var flag = moveDown(grid);
    copyAtoB(grid,ai.grid);
    convert();


    //createNewOne
    if (flag == true) {

    var arr = Random();
    nodes[arr[0] * 4 + arr[1]].htmlText = arr[2];
    var test = document.createTextNode(arr[2]);
    nodes[arr[0] * 4 + arr[1]].appendChild(test);
    grid[arr[0]][arr[1]] = arr[2];
    //cionvert
    convert();
}
    copyAtoB(grid,ai.grid);
    achivegold();
    updaeScoreBoard();
    updateHint();
}


function mLeft()
{
    click();
   var  flag= moveLeft(grid);

    convert();


    //createNewOne
    if(flag==true) {
        var arr = Random();
        nodes[arr[0] * 4 + arr[1]].htmlText = arr[2];
        var test = document.createTextNode(arr[2]);
        nodes[arr[0] * 4 + arr[1]].appendChild(test);
        grid[arr[0]][arr[1]] = arr[2];
        //cionvert
        convert();
    }
    copyAtoB(grid,ai.grid);
    achivegold();
    updaeScoreBoard();
    updateHint();
}

function mRight()
{   click();

   var flag= moveRight(grid);
    convert();
    //createNewOne
    if(flag==true) {
        var arr = Random(grid);
        nodes[arr[0] * 4 + arr[1]].htmlText = arr[2];
        var test = document.createTextNode(arr[2]);
        nodes[arr[0] * 4 + arr[1]].appendChild(test);
        grid[arr[0]][arr[1]] = arr[2];
        //cionvert
        convert();
    }
    copyAtoB(grid,ai.grid);
    achivegold();
    updaeScoreBoard();
    updateHint();
}
function convertForAI()
{
    for(var i=0;i<4;i++)
    {
        for(var j=0;j<4;j++)
        {
            if(ai.grid[i][j]!=0)
                nodes[i * 4 + j].innerHTML = ai.grid[i][j];
            else
                nodes[i * 4 + j].innerHTML = "";
        }
    }

    color();
    updaeScoreBoard();
    updateHint();
}

function convert()
{
  for(var i=0;i<4;i++)
  {
    for(var j=0;j<4;j++)
    {
        if(grid[i][j]!=0)
            nodes[i * 4 + j].innerHTML = grid[i][j];
        else
            nodes[i * 4 + j].innerHTML = "";
    }
   }
    color();
    updaeScoreBoard();
    updateHint();
}
function color()
{
    var c=0;
     nodes=document.getElementsByClassName("blank");
    while(c<nodes.length)
    {
        if(nodes[c].innerHTML==2)
            nodes[c].setAttribute("class", "blank two");
        if(nodes[c].innerHTML==4)
            nodes[c].setAttribute("class", "blank four");
        if(nodes[c].innerHTML==8)
            nodes[c].setAttribute("class", "blank eight");
        if(nodes[c].innerHTML==16)
            nodes[c].setAttribute("class", "blank sixteen");
        if(nodes[c].innerHTML==32)
            nodes[c].setAttribute("class", "blank thirdteen");
        if(nodes[c].innerHTML==64)
            nodes[c].setAttribute("class", "blank sixty");
        if(nodes[c].innerHTML>64&&nodes[c].innerHTML<1024)
            nodes[c].setAttribute("class", "blank other");
        if(nodes[c].innerHTML==1024)
            nodes[c].setAttribute("class", "blank end");
        if(nodes[c].innerHTML>=1024)
            nodes[c].setAttribute("class", "blank up");
        if(nodes[c].innerHTML=="")
            nodes[c].setAttribute("class", "blank");
   c++;

    }



}
//return the num and the cor
function isFull()
{
    for(var i=0;i<grid.length;i++)
     for(var j=0;j<grid.length;j++)
        if(grid[i][j]==0)
            return false;

    return true;
}

function Random() {

    var chose = new Array(2, 2, 2, 2, 4);
    var num =  chose[Math.floor(Math.random() * 5+1)-1];
    var cx;
    var cy;
var rd=new Array();
    cx = Math.floor(Math.random()*4+1)-1;
    cy = Math.floor(Math.random()*4+1)-1;

    while (grid[cx][cy] ){
        if(isFull())
          return null;
        cx = Math.floor(Math.random()*4+1)-1;
        cy = Math.floor(Math.random()*4+1)-1;

    }

    rd[0]=cx;
    rd[1]=cy;
    rd[2]=num;

    return rd;
}




function getMax()
{
    return bigOne;
}
function getScore()
{
    if(score>maxScore)
    maxScore=score;
    return score;
}
function moveLeft() {

    var newLine = new Array();

    if (canMove(grid, "left")) {
        var judge = false;
        var l = grid.length;

        var line = new Array();
        var current;
        var next;

        var s = 0;

        //collect all elements
        for (var i = 0; i < l; i++) {
            //clear array

            newLine=[];
            line = [];
            for (var j = 0; j < l; j++) {
                if (grid[i][j] != 0)
                    line.push(grid[i][j]);
            }

            //count point
            //224 2222 2224 4222
            var c = 0;
          while (line.length >0) {
                current = line[c];
                next = line[c + 1];

                if (canAdd(current, next)) {
                    score = score + next + current;
                    var nnum = 2 * next;
                    line.splice(c, 2);
                    newLine.push(nnum);
                } else {
                    newLine.push(current);
                    line.splice(c,1);

                }
            }

            //update board
           for(var j=0;j<l;j++)
            {
                if(j<newLine.length)
                    grid[i][j]=newLine[j];
                else
                    grid[i][j]=0;
            }
        }
return true;
    }
return false;
}
function moveRight() {

    var newLine = new Array();

    if (canMove(grid, "right")){
        var judge = false;
        var l = grid.length;

        var line = new Array();
        var current;
        var next;

        var s = 0;

        //collect all elements
        for (var i = 0; i < l; i++) {
            //clear array

            newLine=[];
            line = [];
            for (var j = 0; j < l; j++) {
                if (grid[i][j] != 0)
                    line.push(grid[i][j]);
            }

            //count point
            //224 2222 2224 4222
            var c = 0;
            while (line.length >0) {
                current = line[c];
                next = line[c + 1];

                if (canAdd(current, next)) {
                    score = score + next + current;
                    var nnum = 2 * next;
                    line.splice(c, 2);
                    newLine.push(nnum);
                } else {
                    newLine.push(current);
                    line.splice(c,1);

                }
            }

            //update board
            for(var j=l- 1,k=0;j>=0;j--,k++)
            {
                if(k<newLine.length)
                    grid[i][j]=newLine[newLine.length-1-k];
                else
                    grid[i][j]=0;
            }
        }
        return true;
    }
    return false;
}
function moveUp() {


    var newLine = new Array();

    if (canMove(grid, "up")) {
        var judge = false;
        var l = grid.length;

        var line = new Array();
        var current;
        var next;

        var s = 0;

        //collect all elements
        for (var j = 0; j < l; j++) {
            //clear array

            newLine=[];
            line = [];
            for (var i = 0; i < l; i++) {
                if (grid[i][j] != 0)
                    line.push(grid[i][j]);
            }

            //count point
            //224 2222 2224 4222
            var c = 0;
            while (line.length >0) {
                current = line[c];
                next = line[c + 1];

                if (canAdd(current, next)) {
                    score = score + next + current;
                    var nnum = 2 * next;
                    line.splice(c, 2);
                    newLine.push(nnum);
                } else {
                    newLine.push(current);
                    line.splice(c,1);

                }
            }

            //update board
            for(var i=0;i<l;i++)
            {
                if(i<newLine.length)
                    grid[i][j]=newLine[i];
                else
                    grid[i][j]=0;
            }
        }
        return true;
    }
    return false;
}
function moveDown() {


    var newLine = new Array();

    if (canMove(grid, "down")){
        var judge = false;
        var l = grid.length;
        var line = new Array();
        var current;
        var next;
        var s = 0;

        //collect all elements
        for (var j = 0; j < l; j++) {
            //clear array

            newLine=[];
            line = [];
            for (var i = 0; i < l; i++) {
                if (grid[i][j] != 0)
                    line.push(grid[i][j]);
            }

            //count point
            //224 2222 2224 4222
            var c = 0;
            while (line.length >0) {
                current = line[c];
                next = line[c + 1];

                if (canAdd(current, next)) {
                    score = score + next + current;
                    var nnum = 2 * next;
                    line.splice(c, 2);
                    newLine.push(nnum);
                } else {
                    newLine.push(current);
                    line.splice(c,1);

                }
            }

            //update board
            for(var i=l- 1,k=0;i>=0;i--,k++)
            {
                if(k<newLine.length)
                    grid[i][j]=newLine[newLine.length-1-k];
                else
                    grid[i][j]=0;
            }
        }
        return true;
    }
    return false;
}
function canAdd(a, b) {
    if (a == b)
        return true;
    return false;
}



function canMove(board, direction) {
    var judge = false;
    var l = board.length;
    var b = new Array();
    var line = new Array();
    var current;
    var next;

    b = board;
    var s = 0;
    if (direction == "left") {

        for (var i = 0; i < l; i++) {
            line = [];
            for (var j = 0; j < l; j++) {
                if (b[i][j] != 0)
                    line.push(b[i][j]);
            }
            //judge can move or not
            s = line.length;
            for (var c = 0; c < s - 1; c++) {
                current = line[c];
                next = line[c + 1];
                if (canAdd(current, next))
                    return true;
            }
            if (judge == false) {
                for (var j = 0; j < s; j++)
                    if (b[i][j] == 0 && s != 0)
                        return true;
            }
        }
    }

    if (direction == "right") {
        for (var i = 0; i < l; i++) {
            line = [];
            for (var j = 0; j < l; j++) {
                if (b[i][j] != 0)
                    line.push(b[i][j]);
            }
            //judge can move or not
            s = line.length;
            for (var c = 0; c < s - 1; c++) {
                current = line[c];
                next = line[c + 1];
                if (canAdd(current, next))
                    return true;
            }
            if (judge == false) {
                for (var j = l - 1, k = 0; k < s; j--, k++)
                    if (b[i][j] == 0 && s != 0)
                        return true;
            }
        }
    }
    if (direction == "up") {
        for (var j = 0; j < l; j++) {
            line = [];
            for (var i = 0; i < l; i++) {
                if (b[i][j] != 0)
                    line.push(b[i][j]);
            }
            //judge can move or not
            s = line.length;
            for (var c = 0; c < s - 1; c++) {
                current = line[c];
                next = line[c + 1];
                if (canAdd(current, next))
                    return true;
            }
            if (judge == false) {
                for (var k = 0; k < s; k++)
                    if (b[k][j] == 0 && s != 0)
                        return true;
            }
        }
    }
    if (direction == "down") {
        for (var j = 0; j < l; j++) {
            line = [];
            for (var i = 0; i < l; i++) {
                if (b[i][j] != 0)
                    line.push(b[i][j]);
            }
            //judge can move or not
            s = line.length;
            for (var c = 0; c < s - 1; c++) {
                current = line[c];
                next = line[c + 1];
                if (canAdd(current, next))
                    return true;
            }
            if (judge == false) {
                for (var i = l - 1, k = 0; k < s; i--, k++)
                    if (b[i][j] == 0 && s != 0)
                        return true;
            }
        }
    }
    return judge;
}