(function(){
"use strict";

const a = a => document.querySelector(a);

let b = [], c = new Map, d = [], e = {}, f = false, g = null;

const h = [ "unspecified", "front", "back", "left", "right", "top", "bottom" ];

function i(b) {
    a("#alert").textContent = b;
    a("#alert").style.display = "block";
}

function j(a) {
    let b = URL.createObjectURL(a);
    d.push(b);
    return b;
}

function k() {
    for (let a of d) URL.revokeObjectURL(a);
    d = [];
    e = {};
    for (let b of [ "glb", "obj", "js" ]) {
        a("#" + b).disabled = true;
        a("#export-" + b).hidden = true;
        a("#" + b).setAttribute("aria-expanded", "false");
    }
    a("#preview").classList.remove("has-model");
    a("#qualitydetails").hidden = true;
    a("#modelwarning").style.display = "none";
}

function l() {
    a("#filecount").textContent = b.length + " FILE" + (b.length === 1 ? "" : "S");
    a("#filelist").style.display = b.length ? "block" : "none";
    a("#sidehint").style.display = b.length ? "block" : "none";
    let d = a("#filelist");
    d.replaceChildren();
    for (let [e, f] of b.entries()) {
        let i = document.createElement("div");
        i.className = "file-row";
        let j = document.createElement("button");
        j.className = "file-name";
        j.textContent = f.name;
        j.onclick = () => {
            if (g) URL.revokeObjectURL(g);
            g = URL.createObjectURL(f);
            a("#dialogimage").src = g;
            a("#imagedialogtitle").textContent = f.name;
            a("#imagedialog").showModal();
        };
        let k = document.createElement("select");
        k.className = "file-side";
        k.setAttribute("aria-label", "Side for " + f.name);
        for (let a of h) {
            let b = document.createElement("option");
            b.value = a;
            b.textContent = a === "unspecified" ? "Side…" : a[0].toUpperCase() + a.slice(1);
            k.append(b);
        }
        k.value = c.get(f) || "unspecified";
        k.onchange = () => c.set(f, k.value);
        let m = document.createElement("button");
        m.textContent = "✕";
        m.className = "remove-file";
        m.onclick = () => {
            b.splice(e, 1);
            c.delete(f);
            l();
        };
        i.append(j, k, m);
        d.append(i);
    }
    a("#generate").disabled = !b.length || f;
}

a("#closeimage").onclick = () => a("#imagedialog").close();

a("#imagedialog").onclose = () => {
    if (g) URL.revokeObjectURL(g);
    g = null;
};

a("#imagedialog").onclick = b => {
    if (b.target === a("#imagedialog")) a("#imagedialog").close();
};

const m = a("#files"), n = a("#drop");

n.onclick = () => m.click();

n.onkeydown = a => {
    if (a.key === "Enter" || a.key === " ") {
        a.preventDefault();
        m.click();
    }
};

m.onchange = () => {
    b.push(...m.files);
    m.value = "";
    l();
};

n.ondragover = a => {
    a.preventDefault();
    n.classList.add("drag");
};

n.ondragleave = () => n.classList.remove("drag");

n.ondrop = a => {
    a.preventDefault();
    n.classList.remove("drag");
    b.push(...a.dataTransfer.files);
    l();
};

a("#clearimages").onclick = () => {
    b = [];
    c.clear();
    l();
};

a("#help").onclick = a("#setuplink").onclick = () => {
    a("#setup").style.display = a("#setup").style.display === "block" ? "none" : "block";
};

a("#exposure").oninput = b => a("#model").setAttribute("exposure", b.target.value);

a("#loadexample").onclick = async () => {
    try {
        a("#loadexample").disabled = true;
        a("#alert").style.display = "none";
        let d = [];
        for (let e of ["front", "back", "left", "right"]) {
            let f = document.createElement("canvas");
            f.width = 640;
            f.height = 800;
            let g = f.getContext("2d");
            g.fillStyle = "#f6f6f2";
            g.fillRect(0, 0, 640, 800);
            g.fillStyle = "#174e98";
            g.beginPath();
            g.roundRect(190, 75, 260, 650, 30);
            g.fill();
            g.fillStyle = "#cdd5da";
            g.fillRect(195, 78, 250, 36);
            g.fillRect(195, 687, 250, 32);
            g.fillStyle = "#e8f2fb";
            g.fillRect(190, 300, 260, 175);
            g.fillStyle = "#224773";
            g.textAlign = "center";
            g.font = "bold 38px Arial";
            g.fillText(e === "front" ? "SAMPLE" : e.toUpperCase(), 320, 370);
            g.font = "24px Arial";
            g.fillText("DEMO CAN", 320, 414);
            let h = await new Promise((a, b) => f.toBlob(c => c ? a(c) : b(Error("Could not create example image")), "image/png"));
            let i = new File([h], "example-" + e + ".png", {type:"image/png"});
            d.push(i);
            c.set(i, e);
        }
        b = d;
        l();
    } catch (b) {
        i(b.message);
    } finally {
        a("#loadexample").disabled = false;
    }
};

async function o(a) {
    let b = await createImageBitmap(a), d = 1024, e = Math.min(1, d / Math.max(b.width, b.height));
    let f = document.createElement("canvas");
    f.width = Math.max(1, Math.round(b.width * e));
    f.height = Math.max(1, Math.round(b.height * e));
    let g = f.getContext("2d", {
        willReadFrequently: true
    });
    g.drawImage(b, 0, 0, f.width, f.height);
    b.close();
    let h = g.getImageData(0, 0, f.width, f.height), i = h.data, j = f.width, k = f.height;
    let l = [ [ 0, 0 ], [ j - 1, 0 ], [ 0, k - 1 ], [ j - 1, k - 1 ] ].map(([a, b]) => {
        let c = (b * j + a) * 4;
        return [ i[c], i[c + 1], i[c + 2] ];
    });
    let m = [ 0, 1, 2 ].map(a => l.reduce((b, c) => b + c[a], 0) / 4);
    let n = new Uint8Array(j * k), o = j, p = k, q = 0, r = 0, s = 0;
    for (let a = 0; a < k; a++) for (let b = 0; b < j; b++) {
        let c = a * j + b, d = c * 4, e = Math.hypot(i[d] - m[0], i[d + 1] - m[1], i[d + 2] - m[2]);
        if (i[d + 3] > 16 && e > 42) {
            n[c] = 1;
            o = Math.min(o, b);
            q = Math.max(q, b);
            p = Math.min(p, a);
            r = Math.max(r, a);
            s++;
        }
    }
    if (s < 50 || r - p < 10 || q - o < 5) throw Error("Could not isolate " + a.name + ". Use a clear object on a contrasting plain background.");
    return {
        f: a,
        c: f,
        p: i,
        mask: n,
        w: j,
        h: k,
        box: [ o, p, q - o + 1, r - p + 1 ],
        area: s,
        side: c.get(a) || "unspecified"
    };
}

function p(a) {
    return a.reduce((a, b) => !a || b.area > a.area ? b : a, null);
}

function q(a, b) {
    let [c, d, e, f] = a.box, g = [];
    for (let h = 0; h <= b; h++) {
        let i = Math.min(a.h - 1, d + Math.floor(h / b * (f - 1))), j = a.w, k = 0;
        for (let b = c; b < c + e; b++) if (a.mask[i * a.w + b]) {
            j = Math.min(j, b);
            k = Math.max(k, b);
        }
        g.push(k >= j ? Math.max(.02, (k - j + 1) / f) : e / f);
    }
    for (let a = 0; a < 3; a++) g = g.map((a, c) => (g[Math.max(0, c - 1)] + 2 * a + g[Math.min(b, c + 1)]) / 4);
    return g;
}

function r(a, b, c) {
    let [d, e, f, g] = a.box;
    return [ Math.min(a.w - 1, Math.max(0, Math.floor(d + b * (f - 1)))), Math.min(a.h - 1, Math.max(0, Math.floor(e + c * (g - 1)))) ];
}

async function s(a, b) {
    let c = a.filter(a => ![ "top", "bottom" ].includes(a.side));
    if (!c.length) throw Error("Add at least one side photo.");
    let d = p(c.filter(a => a.side === "front")) || p(c), e = {};
    for (let b of [ "front", "back", "left", "right", "top", "bottom" ]) e[b] = p(a.filter(a => a.side === b));
    e.front = e.front || d;
    let f = c.map(a => q(a, 128));
    let g = Array.from({
        length: 129
    }, (a, b) => {
        let c = f.map(a => a[b]).sort((a, b) => a - b);
        return c[Math.floor(c.length / 2)];
    });
    let h = document.createElement("canvas");
    h.width = 1024;
    h.height = 1024;
    let i = h.getContext("2d"), j = i.createImageData(1024, 1024), k = j.data;
    for (let a = 0; a < 768; a++) for (let b = 0; b < 1024; b++) {
        let c = b / 1023 * 2 * Math.PI - Math.PI, f = Math.cos(c), g = Math.sin(c), h = Math.abs(f) >= Math.abs(g) ? f >= 0 ? "front" : "back" : g >= 0 ? "right" : "left";
        let i = e[h] || d, j = (h === "front" ? g : h === "back" ? -g : h === "right" ? -f : f) * .5 + .5, l = a / 767, [m, n] = r(i, Math.max(0, Math.min(1, j)), l), o = (n * i.w + m) * 4, p = (a * 1024 + b) * 4;
        k[p] = i.p[o];
        k[p + 1] = i.p[o + 1];
        k[p + 2] = i.p[o + 2];
        k[p + 3] = 255;
    }
    for (let a = 768; a < 1024; a++) for (let b = 0; b < 1024; b++) {
        let c = b < 512, f = e[c ? "top" : "bottom"] || d, g = b % 512 / 511, h = (a - 768) / 255, [i, j] = r(f, g, h), l = (j * f.w + i) * 4, m = (a * 1024 + b) * 4;
        k[m] = f.p[l];
        k[m + 1] = f.p[l + 1];
        k[m + 2] = f.p[l + 2];
        k[m + 3] = 255;
    }
    i.putImageData(j, 0, 0);
    let l = await new Promise(a => h.toBlob(a, "image/png"));
    const m = 128, n = 128, o = [], s = [], t = [], u = [];
    function v(a, b, c, d, e) {
        o.push(a, b, c);
        s.push(d, e);
        let f = Math.min(1023, Math.max(0, Math.round(d * 1023))), g = Math.min(1023, Math.max(0, Math.round(e * 1023))), h = (g * 1024 + f) * 4;
        u.push(k[h] / 255, k[h + 1] / 255, k[h + 2] / 255);
        return o.length / 3 - 1;
    }
    for (let a = 0; a <= n; a++) for (let b = 0; b <= m; b++) {
        let c = b / m * 2 * Math.PI - Math.PI, d = g[a], e = 1 - 2 * a / n;
        v(d * Math.sin(c), e, d * Math.cos(c), b / m, a / n * .749);
    }
    for (let a = 0; a < n; a++) for (let b = 0; b < m; b++) {
        let c = a * (m + 1) + b, d = c + m + 1;
        t.push(c, d, c + 1, c + 1, d, d + 1);
    }
    for (let a of [ true, false ]) {
        let c = 12, d = o.length / 3;
        for (let d = 0; d <= c; d++) for (let f = 0; f <= m; f++) {
            let h = f / m * 2 * Math.PI - Math.PI, i = d / c, j = g[a ? 0 : n] * i, k = a ? 1 : -1 + (e.bottom ? b * (1 - i * i) : 0);
            let l = (a ? 0 : .5) + (.25 + .245 * i * Math.sin(h)) * .5, o = .875 + .12 * i * Math.cos(h);
            v(j * Math.sin(h), k, j * Math.cos(h), l, o);
        }
        for (let b = 0; b < c; b++) for (let c = 0; c < m; c++) {
            let e = d + b * (m + 1) + c, f = e + m + 1;
            if (a) t.push(e, f, e + 1, e + 1, f, f + 1); else t.push(e, e + 1, f, e + 1, f + 1, f);
        }
    }
    let w = new Float32Array(o.length);
    for (let a = 0; a < t.length; a += 3) {
        let b = t[a] * 3, c = t[a + 1] * 3, d = t[a + 2] * 3, e = o[c] - o[b], f = o[c + 1] - o[b + 1], g = o[c + 2] - o[b + 2], h = o[d] - o[b], i = o[d + 1] - o[b + 1], j = o[d + 2] - o[b + 2], k = f * j - g * i, l = g * h - e * j, m = e * i - f * h;
        for (let a of [ b, c, d ]) {
            w[a] += k;
            w[a + 1] += l;
            w[a + 2] += m;
        }
    }
    for (let a = 0; a < w.length; a += 3) {
        let b = Math.hypot(w[a], w[a + 1], w[a + 2]) || 1;
        w[a] /= b;
        w[a + 1] /= b;
        w[a + 2] /= b;
    }
    return {
        pos: new Float32Array(o),
        uv: new Float32Array(s),
        norm: w,
        idx: new Uint32Array(t),
        colors: new Float32Array(u),
        png: l,
        views: c.length
    };
}

function t(a) {
    let b = a.reduce((a, b) => a + (b.byteLength + 3 & ~3), 0), c = new Uint8Array(b), d = [], e = 0;
    for (let b of a) {
        d.push(e);
        c.set(new Uint8Array(b.buffer || b, b.byteOffset || 0, b.byteLength), e);
        e += b.byteLength + 3 & ~3;
    }
    return [ c, d ];
}

async function u(a) {
    let b = new Uint8Array(await a.png.arrayBuffer()), c = [ a.pos, a.norm, a.uv, a.idx, b ], [d, e] = t(c), f = a.pos.length / 3, g = [ Infinity, Infinity, Infinity ], h = [ -Infinity, -Infinity, -Infinity ];
    for (let b = 0; b < a.pos.length; b++) {
        let c = b % 3;
        g[c] = Math.min(g[c], a.pos[b]);
        h[c] = Math.max(h[c], a.pos[b]);
    }
    let i = {
        asset: {
            version: "2.0",
            generator: "img2fxomjs JavaScript approximation"
        },
        scene: 0,
        scenes: [ {
            nodes: [ 0 ]
        } ],
        nodes: [ {
            mesh: 0
        } ],
        meshes: [ {
            primitives: [ {
                attributes: {
                    POSITION: 0,
                    NORMAL: 1,
                    TEXCOORD_0: 2
                },
                indices: 3,
                material: 0
            } ]
        } ],
        materials: [ {
            pbrMetallicRoughness: {
                baseColorTexture: {
                    index: 0
                },
                metallicFactor: 0,
                roughnessFactor: .9
            },
            doubleSided: false
        } ],
        textures: [ {
            source: 0
        } ],
        images: [ {
            bufferView: 4,
            mimeType: "image/png"
        } ],
        buffers: [ {
            byteLength: d.byteLength
        } ],
        bufferViews: c.map((a, b) => ({
            buffer: 0,
            byteOffset: e[b],
            byteLength: a.byteLength,
            ...b < 4 ? {
                target: b === 3 ? 34963 : 34962
            } : {}
        })),
        accessors: [ {
            bufferView: 0,
            componentType: 5126,
            count: f,
            type: "VEC3",
            min: g,
            max: h
        }, {
            bufferView: 1,
            componentType: 5126,
            count: f,
            type: "VEC3"
        }, {
            bufferView: 2,
            componentType: 5126,
            count: f,
            type: "VEC2"
        }, {
            bufferView: 3,
            componentType: 5125,
            count: a.idx.length,
            type: "SCALAR"
        } ]
    };
    let j = (new TextEncoder).encode(JSON.stringify(i)), k = j.length + 3 & ~3, l = new Uint8Array(20 + k + 8), m = new DataView(l.buffer);
    m.setUint32(0, 1179937895, true);
    m.setUint32(4, 2, true);
    m.setUint32(8, l.length + d.length, true);
    m.setUint32(12, k, true);
    m.setUint32(16, 1313821514, true);
    l.fill(32, 20, 20 + k);
    l.set(j, 20);
    m.setUint32(20 + k, d.length, true);
    m.setUint32(24 + k, 5130562, true);
    return new Blob([ l, d ], {
        type: "model/gltf-binary"
    });
}

function v(a) {
    return Array.from(a, a => Number(a.toFixed(5))).join(",");
}

function w(a) {
    return `function createmodel(){\nconst geometry=new FaoxomJs.Geometry();\ngeometry.setAttribute('position',new Float32Array([${v(a.pos)}]),3);\ngeometry.setAttribute('color',new Float32Array([${v(a.colors)}]),3);\ngeometry.setIndex(new Uint32Array([${Array.from(a.idx).join(",")}]));\ngeometry.computeVertexNormals();\nreturn new FaoxomJs.Mesh(geometry,new FaoxomJs.PhysicalMaterial({color:0xffffff,vertexColors:true,roughness:0.85}));\n}\n`;
}

function x(a) {
    let b = [];
    for (let c = 0; c < a.pos.length; c += 3) b.push(`v ${a.pos[c]} ${a.pos[c + 1]} ${a.pos[c + 2]} ${a.colors[c]} ${a.colors[c + 1]} ${a.colors[c + 2]}`);
    for (let c = 0; c < a.idx.length; c += 3) b.push(`f ${a.idx[c] + 1} ${a.idx[c + 1] + 1} ${a.idx[c + 2] + 1}`);
    return b.join("\n");
}

async function y(a) {
    let b = document.querySelector("#faoxomsource"), c;
    if (b && b.textContent.trim()) c = new Blob([b.textContent], {type:"text/javascript"});
    else { let d = await fetch("static/faoxom.min.js"); if (!d.ok) throw Error("FaoxomJS library unavailable"); c = await d.blob(); }
    let d = await new Promise((a, b) => {
        let d = new FileReader;
        d.onload = () => a(d.result.split(",")[1]);
        d.onerror = b;
        d.readAsDataURL(c);
    });
    let e = d.match(/.{1,2048}/g).map(a => JSON.stringify(a)).join(",\n");
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden}canvas{display:block}</style></head><body><script>eval(new TextDecoder().decode(Uint8Array.from(atob([' + e + '].join("")),c=>c.charCodeAt(0))))</' + "script><script>" + a + "</" + 'script><script>const scene=new FaoxomJs.Scene(),camera=new FaoxomJs.PerspectiveCamera(50,innerWidth/innerHeight,.01,1000);camera.position.set(0,0,4.2);const renderer=new FaoxomJs.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);const model=createmodel();scene.add(model);const light=new FaoxomJs.DirectionalLight(0xffffff,2);light.position.set(4,6,7);scene.add(light);const fill=new FaoxomJs.DirectionalLight(0xffffff,1);fill.position.set(-4,2,-4);scene.add(fill);addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});function animate(){requestAnimationFrame(animate);model.rotation.y+=.004;renderer.render(scene,camera)}animate();</' + "script></body></html>";
}

function z(b, c) {
    a("#code-" + b).textContent = c.length > 12e4 ? c.slice(0, 12e4) + "\n… Preview truncated. Copy or download for the full export." : c;
    a("#copy-" + b).disabled = false;
}

for (let b of [ "glb", "obj", "js" ]) {
    a("#" + b).onclick = async () => {
        let c = a("#export-" + b);
        c.hidden = !c.hidden;
        a("#" + b).setAttribute("aria-expanded", String(!c.hidden));
        if (c.hidden) return;
        let d = e[b];
        if (b === "js") {
            let a = 0;
            d = d.replace(/,/g, () => ++a % 250 === 0 ? ",\n" : ",");
        }
        if (b === "glb") {
            let a = await new Promise((a, b) => {
                let c = new FileReader;
                c.onload = () => a(c.result.split(",")[1]);
                c.onerror = b;
                c.readAsDataURL(d);
            });
            d = "const glbbase64 = [" + a.match(/.{1,2048}/g).map(a => JSON.stringify(a)).join(",\n") + '].join("");\nconst glbbytes = Uint8Array.from(atob(glbbase64),c=>c.charCodeAt(0));';
            e.glbText = d;
        }
        if (b === "js" && a("#jsformat").value === "html") {
            try {
                d = e.html || (e.html = await y(d));
            } catch (a) {
                i(a.message);
                return;
            }
        }
        z(b, d);
        let f = b === "glb" ? e.glb : new Blob([ d ], {
            type: b === "js" && a("#jsformat").value === "html" ? "text/html" : "text/plain"
        });
        a("#download-" + b).href = j(f);
        a("#download-" + b).download = b === "glb" ? "model.glb" : b === "obj" ? "model.obj" : a("#jsformat").value === "html" ? "model.faoxom.html" : "model.faoxom.js";
    };
    a("#copy-" + b).onclick = async () => {
        try {
            let c = b === "glb" ? e.glbText : b === "js" && a("#jsformat").value === "html" ? e.html : e[b];
            await navigator.clipboard.writeText(c);
            a("#copy-" + b).textContent = "✓ Copied";
            setTimeout(() => a("#copy-" + b).textContent = "⧉ Copy", 1500);
        } catch (a) {
            i("Copy unavailable; use Download.");
        }
    };
}

a("#jsformat").onchange = () => {
    if (!a("#export-js").hidden) {
        a("#export-js").hidden = true;
        a("#js").click();
    }
};

a("#generate").onclick = async () => {
    f = true;
    l();
    k();
    a("#alert").style.display = "none";
    a("#stage").textContent = "Reading photos…";
    a("#progress").style.width = "10%";
    a("#percent").textContent = "10%";
    try {
        await new Promise(a => setTimeout(a, 30));
        let c = [];
        for (let a of b) c.push(await o(a));
        a("#stage").textContent = "Building browser approximation…";
        a("#progress").style.width = "35%";
        await new Promise(a => setTimeout(a, 30));
        let d = Math.max(0, Math.min(.4, Number(a("#bottomrecess").value) || 0)), f = await s(c, d);
        a("#stage").textContent = "Creating exports…";
        a("#progress").style.width = "75%";
        await new Promise(a => setTimeout(a, 30));
        e.glb = await u(f);
        e.obj = x(f);
        e.js = w(f);
        a("#model").src = j(e.glb);
        a("#preview").classList.add("has-model");
        for (let b of [ "glb", "obj", "js" ]) a("#" + b).disabled = false;
        a("#stage").textContent = "Complete · browser approximation";
        a("#progress").style.width = "100%";
        a("#percent").textContent = "100%";
        a("#statusdesc").textContent = `${f.views} side views · ${f.pos.length / 3} vertices · ${f.idx.length / 3} faces`;
        a("#modelwarning").textContent = "This JavaScript clone produces a symmetric approximation, not a calibrated 3D scan. Camera setup, OCR, same-side alignment, and image comparison are not yet implemented. Unseen sides are estimated; scale is arbitrary.";
        a("#modelwarning").style.display = "block";
    } catch (b) {
        a("#stage").textContent = "Could not reconstruct";
        a("#progress").style.width = "0%";
        i(b.message);
    } finally {
        f = false;
        l();
    }
};

l();

})();
