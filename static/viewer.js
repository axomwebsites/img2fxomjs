class meshviewer extends HTMLElement {
  constructor() {
    super();
    this.loaded = false;
    this.angle = 0;
    this.pitch = 0;
    this.zoom = 1.9;
    this.drag = null;
    this.token = 0;
    this.attachShadow({mode:'open'});
    this.shadowRoot.innerHTML = '<style>:host{display:block;width:100%;height:100%;touch-action:none}canvas{display:block;width:100%;height:100%;cursor:grab}canvas:active{cursor:grabbing}.notice{position:absolute;bottom:14px;left:14px;color:#fff;font:12px sans-serif;pointer-events:none}</style><canvas aria-label="Interactive 3D model preview"></canvas><div class="notice" role="status"></div>';
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.notice = this.shadowRoot.querySelector('.notice');
    this.gl = this.canvas.getContext('webgl2',{antialias:true,alpha:true,premultipliedAlpha:false});
    if (!this.gl) {this.notice.textContent='WebGL 2 is required to display the model.';return;}
    try {this.init()} catch(e) {this.notice.textContent='Could not start the 3D viewer: '+e.message;return;}
    this.canvas.addEventListener('pointerdown',e=>{this.drag=[e.clientX,e.clientY];this.canvas.setPointerCapture(e.pointerId)});
    this.canvas.addEventListener('pointermove',e=>{if(!this.drag)return;this.angle+=(e.clientX-this.drag[0])*.009;this.pitch=Math.max(-1.48,Math.min(1.48,this.pitch+(e.clientY-this.drag[1])*.009));this.drag=[e.clientX,e.clientY];this.draw()});
    this.canvas.addEventListener('pointerup',()=>{this.drag=null});
    this.canvas.addEventListener('pointercancel',()=>{this.drag=null});
    this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.min(9,Math.max(1.5,this.zoom*Math.exp(e.deltaY*.001)));this.draw()},{passive:false});
    this.resize = new ResizeObserver(()=>this.draw());
  }
  connectedCallback(){if(this.resize)this.resize.observe(this)}
  disconnectedCallback(){if(this.resize)this.resize.disconnect();this.token++;this.clear()}
  static get observedAttributes(){return ['exposure']}
  attributeChangedCallback(){if(this.gl)this.draw()}
  set src(a){this.path=a;this.load(a)}
  get src(){return this.path||''}
  init(){
    const a=this.gl;
    const b=`#version 300 es
in vec3 position; in vec3 normal; in vec2 uv;
uniform mat4 projection; uniform mat4 view;
out vec3 direction; out vec2 texcoord;
void main(){gl_Position=projection*view*vec4(position,1.0);direction=normal;texcoord=uv;}`;
    const c=`#version 300 es
precision highp float;
in vec3 direction; in vec2 texcoord;
uniform sampler2D texturemap; uniform float exposure;
out vec4 color;
void main(){vec3 n=normalize(direction); float key=max(dot(n,normalize(vec3(0.5,0.75,1.0))),0.0);float fill=max(dot(n,normalize(vec3(-0.7,0.25,-0.6))),0.0);vec4 tex=texture(texturemap,texcoord);float light=0.58+0.33*key+0.17*fill;color=vec4(clamp(tex.rgb*light*exposure,0.0,1.0),tex.a);}`;
    const d=(e,f)=>{let g=a.createShader(e);a.shaderSource(g,f);a.compileShader(g);if(!a.getShaderParameter(g,a.COMPILE_STATUS))throw Error(a.getShaderInfoLog(g));return g};
    this.program=a.createProgram();a.attachShader(this.program,d(a.VERTEX_SHADER,b));a.attachShader(this.program,d(a.FRAGMENT_SHADER,c));a.linkProgram(this.program);if(!a.getProgramParameter(this.program,a.LINK_STATUS))throw Error(a.getProgramInfoLog(this.program));
    this.locations={position:a.getAttribLocation(this.program,'position'),normal:a.getAttribLocation(this.program,'normal'),uv:a.getAttribLocation(this.program,'uv'),projection:a.getUniformLocation(this.program,'projection'),view:a.getUniformLocation(this.program,'view'),texturemap:a.getUniformLocation(this.program,'texturemap'),exposure:a.getUniformLocation(this.program,'exposure')};
    a.enable(a.DEPTH_TEST);a.clearColor(0,0,0,0);
  }
  clear(){if(!this.gl||!this.mesh)return;for(const a of this.mesh.buffers)this.gl.deleteBuffer(a);this.gl.deleteVertexArray(this.mesh.vao);this.gl.deleteTexture(this.mesh.texture);this.mesh=null}
  async load(a){
    let b=++this.token;this.loaded=false;this.notice.textContent='Loading model…';
    try{
      if(!this.gl||!this.program)throw Error('WebGL 2 is unavailable');
      let c=await fetch(a);if(!c.ok)throw Error('Could not read the model');let d=await c.arrayBuffer();if(b!==this.token)return;
      let e=new DataView(d);if(e.getUint32(0,true)!==0x46546c67||e.getUint32(4,true)!==2)throw Error('This viewer requires a GLB 2.0 file');
      let f=12,g=null,h=null;while(f+8<=d.byteLength){let i=e.getUint32(f,true),j=e.getUint32(f+4,true);if(f+8+i>d.byteLength)throw Error('Invalid GLB chunk');if(j===0x4e4f534a)g=JSON.parse(new TextDecoder().decode(new Uint8Array(d,f+8,i)));if(j===0x004e4942)h=new Uint8Array(d,f+8,i);f+=8+i}
      if(!g||!h)throw Error('Missing GLB data');let i=g.meshes?.[0]?.primitives?.[0];if(!i||i.mode!==undefined&&i.mode!==4)throw Error('Only triangle meshes are supported');
      const j=(k)=>{let l=g.accessors[k],m=g.bufferViews[l.bufferView];if(!l||!m||l.sparse||m.byteStride)throw Error('Unsupported GLB accessor');let n=({5126:Float32Array,5125:Uint32Array,5123:Uint16Array,5121:Uint8Array})[l.componentType],o=({SCALAR:1,VEC2:2,VEC3:3,VEC4:4})[l.type];if(!n||!o)throw Error('Unsupported GLB component');let p=m.byteOffset||0,q=l.byteOffset||0,r=h.byteOffset+p+q;if(r+l.count*o*n.BYTES_PER_ELEMENT>h.byteOffset+h.byteLength)throw Error('Invalid GLB buffer');return new n(h.buffer,r,l.count*o)};
      let k=j(i.attributes.POSITION),l=j(i.attributes.NORMAL),m=j(i.attributes.TEXCOORD_0),n=j(i.indices);if(!(k instanceof Float32Array)||!(l instanceof Float32Array)||!(m instanceof Float32Array))throw Error('Unsupported vertex format');
      let o=g.materials?.[i.material]?.pbrMetallicRoughness?.baseColorTexture?.index,p=g.textures?.[o]?.source,q=g.images?.[p],r=q&&g.bufferViews[q.bufferView];if(!r)throw Error('The model needs an embedded texture');let s=new Blob([h.slice(r.byteOffset||0,(r.byteOffset||0)+r.byteLength)],{type:q.mimeType||'image/png'}),t=await createImageBitmap(s);if(b!==this.token){t.close();return}
      this.clear();let u=this.gl,v=a=>{let b=u.createBuffer();u.bindBuffer(u.ARRAY_BUFFER,b);u.bufferData(u.ARRAY_BUFFER,a,u.STATIC_DRAW);return b},w=u.createVertexArray();u.bindVertexArray(w);let x=[];for(let [y,z,aa] of [[k,this.locations.position,3],[l,this.locations.normal,3],[m,this.locations.uv,2]]){let ab=v(y);x.push(ab);u.enableVertexAttribArray(z);u.vertexAttribPointer(z,aa,u.FLOAT,false,0,0)}let y=u.createBuffer();x.push(y);u.bindBuffer(u.ELEMENT_ARRAY_BUFFER,y);u.bufferData(u.ELEMENT_ARRAY_BUFFER,n,u.STATIC_DRAW);
      let z=u.createTexture();u.bindTexture(u.TEXTURE_2D,z);u.pixelStorei(u.UNPACK_FLIP_Y_WEBGL,false);u.texImage2D(u.TEXTURE_2D,0,u.RGBA,u.RGBA,u.UNSIGNED_BYTE,t);t.close();u.texParameteri(u.TEXTURE_2D,u.TEXTURE_MIN_FILTER,u.LINEAR_MIPMAP_LINEAR);u.texParameteri(u.TEXTURE_2D,u.TEXTURE_MAG_FILTER,u.LINEAR);u.texParameteri(u.TEXTURE_2D,u.TEXTURE_WRAP_S,u.CLAMP_TO_EDGE);u.texParameteri(u.TEXTURE_2D,u.TEXTURE_WRAP_T,u.CLAMP_TO_EDGE);u.generateMipmap(u.TEXTURE_2D);
      let aa=g.accessors[i.attributes.POSITION],ab=aa.min,ac=aa.max,ad=ab.map((a,b)=>(a+ac[b])/2),ae=Math.max(...ac.map((a,b)=>a-ab[b]));this.mesh={vao:w,buffers:x,texture:z,count:n.length,type:n instanceof Uint32Array?u.UNSIGNED_INT:n instanceof Uint16Array?u.UNSIGNED_SHORT:u.UNSIGNED_BYTE,center:ad,size:ae||2};this.loaded=true;this.notice.textContent='Drag to rotate · scroll to zoom';this.draw();this.dispatchEvent(new Event('load'));
    }catch(c){if(b!==this.token)return;this.notice.textContent='Could not display model: '+c.message;this.dispatchEvent(new CustomEvent('error',{detail:c.message}))}
  }
  draw(){if(!this.gl||!this.program)return;let a=this.gl,b=this.canvas.clientWidth,c=this.canvas.clientHeight;if(!b||!c)return;let d=Math.min(devicePixelRatio||1,2),e=Math.max(1,Math.floor(b*d)),f=Math.max(1,Math.floor(c*d));if(this.canvas.width!==e||this.canvas.height!==f){this.canvas.width=e;this.canvas.height=f}a.viewport(0,0,e,f);a.clear(a.COLOR_BUFFER_BIT|a.DEPTH_BUFFER_BIT);if(!this.mesh)return;
    let g=this.mesh,h=g.center,i=g.size*this.zoom,j=this.angle,k=this.pitch,l=[h[0]+i*Math.sin(j)*Math.cos(k),h[1]+i*Math.sin(k),h[2]+i*Math.cos(j)*Math.cos(k)],m=(a,b)=>a.map((x,i)=>x-b[i]),n=a=>{let b=Math.hypot(...a)||1;return a.map(x=>x/b)},o=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],p=(a,b)=>a.reduce((x,y,i)=>x+y*b[i],0),q=n(m(l,h)),r=n(o([0,1,0],q)),s=o(q,r),t=new Float32Array([r[0],s[0],q[0],0,r[1],s[1],q[1],0,r[2],s[2],q[2],0,-p(r,l),-p(s,l),-p(q,l),1]),u=1/Math.tan(Math.PI/7),v=e/f,w=Math.max(.001,g.size*.01),x=g.size*30,y=new Float32Array([u/v,0,0,0,0,u,0,0,0,0,(x+w)/(w-x),-1,0,0,2*x*w/(w-x),0]);a.useProgram(this.program);a.uniformMatrix4fv(this.locations.projection,false,y);a.uniformMatrix4fv(this.locations.view,false,t);a.uniform1f(this.locations.exposure,Math.max(.1,Number(this.getAttribute('exposure'))||1));a.activeTexture(a.TEXTURE0);a.bindTexture(a.TEXTURE_2D,g.texture);a.uniform1i(this.locations.texturemap,0);a.bindVertexArray(g.vao);a.drawElements(a.TRIANGLES,g.count,g.type,0);
  }
}
customElements.define('mesh-viewer',meshviewer);
