class meshviewer extends HTMLElement {
  constructor(){
    super();this.loaded=false;this.angle=0;this.pitch=0;this.zoom=1.9;this.drag=null;this.token=0;
    this.attachShadow({mode:'open'});this.shadowRoot.innerHTML='<style>:host{display:block;width:100%;height:100%;touch-action:none}canvas{display:block;width:100%;height:100%;cursor:grab}canvas:active{cursor:grabbing}.notice{position:absolute;bottom:14px;left:14px;color:#fff;font:12px sans-serif;pointer-events:none}</style><canvas aria-label="Interactive 3D model preview"></canvas><div class="notice" role="status"></div>';
    this.canvas=this.shadowRoot.querySelector('canvas');this.notice=this.shadowRoot.querySelector('.notice');
    try{
      this.renderer=new FaoxomJs.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:true,clearAlpha:0,pixelRatio:Math.min(devicePixelRatio||1,2)});
      if(!this.renderer.gl)throw Error('WebGL is unavailable');
      this.scene=new FaoxomJs.Scene();this.camera=new FaoxomJs.PerspectiveCamera(51.43,1,.01,1000);this.scene.add(new FaoxomJs.AmbientLight(0xffffff,.45));
      let a=new FaoxomJs.DirectionalLight(0xffffff,1.0);a.position.set(4,6,7);this.scene.add(a);let b=new FaoxomJs.DirectionalLight(0xffffff,.45);b.position.set(-4,2,-4);this.scene.add(b);
    }catch(a){this.notice.textContent='Could not start FaoxomJS viewer: '+a.message;return}
    this.canvas.addEventListener('pointerdown',a=>{this.drag=[a.clientX,a.clientY];this.canvas.setPointerCapture(a.pointerId)});
    this.canvas.addEventListener('pointermove',a=>{if(!this.drag)return;this.angle+=(a.clientX-this.drag[0])*.009;this.pitch=Math.max(-1.48,Math.min(1.48,this.pitch+(a.clientY-this.drag[1])*.009));this.drag=[a.clientX,a.clientY];this.draw()});
    this.canvas.addEventListener('pointerup',()=>{this.drag=null});this.canvas.addEventListener('pointercancel',()=>{this.drag=null});
    this.canvas.addEventListener('wheel',a=>{a.preventDefault();this.zoom=Math.min(9,Math.max(1.5,this.zoom*Math.exp(a.deltaY*.001)));this.draw()},{passive:false});this.resize=new ResizeObserver(()=>this.draw());
  }
  connectedCallback(){if(this.resize)this.resize.observe(this)}
  disconnectedCallback(){if(this.resize)this.resize.disconnect();this.token++;this.clear()}
  static get observedAttributes(){return ['exposure']}
  attributeChangedCallback(){this.draw()}
  set src(a){this.path=a;this.load(a)}
  get src(){return this.path||''}
  clear(){if(!this.mesh)return;this.scene.remove(this.mesh);if(this.mesh.geometry.dispose)this.mesh.geometry.dispose();if(this.mesh.material.dispose)this.mesh.material.dispose();if(this.bitmap)this.bitmap.close();this.bitmap=null;this.mesh=null}
  async load(a){
    let b=++this.token;this.loaded=false;this.notice.textContent='Loading model…';
    try{
      if(!this.renderer||!this.renderer.gl)throw Error('FaoxomJS WebGL is unavailable');
      let c=await fetch(a);if(!c.ok)throw Error('Could not read the model');let d=await c.arrayBuffer();if(b!==this.token)return;
      let e=new DataView(d);if(e.getUint32(0,true)!==0x46546c67||e.getUint32(4,true)!==2)throw Error('This viewer requires a GLB 2.0 file');
      let f=12,g=null,h=null;while(f+8<=d.byteLength){let i=e.getUint32(f,true),j=e.getUint32(f+4,true);if(f+8+i>d.byteLength)throw Error('Invalid GLB chunk');if(j===0x4e4f534a)g=JSON.parse(new TextDecoder().decode(new Uint8Array(d,f+8,i)));if(j===0x004e4942)h=new Uint8Array(d,f+8,i);f+=8+i}
      if(!g||!h)throw Error('Missing GLB data');let i=g.meshes?.[0]?.primitives?.[0];if(!i||i.mode!==undefined&&i.mode!==4)throw Error('Only triangle meshes are supported');
      const j=(k)=>{let l=g.accessors[k],m=g.bufferViews[l.bufferView];if(!l||!m||l.sparse||m.byteStride)throw Error('Unsupported GLB accessor');let n=({5126:Float32Array,5125:Uint32Array,5123:Uint16Array,5121:Uint8Array})[l.componentType],o=({SCALAR:1,VEC2:2,VEC3:3,VEC4:4})[l.type];if(!n||!o)throw Error('Unsupported GLB component');let p=m.byteOffset||0,q=l.byteOffset||0,r=h.byteOffset+p+q;if(r+l.count*o*n.BYTES_PER_ELEMENT>h.byteOffset+h.byteLength)throw Error('Invalid GLB buffer');return new n(h.buffer,r,l.count*o)};
      let k=j(i.attributes.POSITION),l=j(i.attributes.NORMAL),m=j(i.attributes.TEXCOORD_0),n=j(i.indices);if(!(k instanceof Float32Array)||!(l instanceof Float32Array)||!(m instanceof Float32Array))throw Error('Unsupported vertex format');
      let o=g.materials?.[i.material]?.pbrMetallicRoughness?.baseColorTexture?.index,p=g.textures?.[o]?.source,q=g.images?.[p],r=q&&g.bufferViews[q.bufferView];if(!r)throw Error('The model needs an embedded texture');let s=new Blob([h.slice(r.byteOffset||0,(r.byteOffset||0)+r.byteLength)],{type:q.mimeType||'image/png'}),t=await createImageBitmap(s);if(b!==this.token){t.close();return}
      this.clear();this.bitmap=t;let u=new FaoxomJs.Geometry();u.setAttribute('position',k,3);u.setAttribute('normal',l,3);u.setAttribute('uv',m,2);u.setIndex(n);
      let v=new FaoxomJs.Texture(t,{flipY:false,wrapS:'clampToEdge',wrapT:'clampToEdge'}),w=new FaoxomJs.PhysicalMaterial({color:0xffffff,map:v,metalness:0,roughness:.9});this.mesh=new FaoxomJs.Mesh(u,w);this.scene.add(this.mesh);
      let x=g.accessors[i.attributes.POSITION],y=x.min,z=x.max;this.center=y.map((a,b)=>(a+z[b])/2);this.size=Math.max(...z.map((a,b)=>a-y[b]))||2;this.notice.textContent='Drag to rotate · scroll to zoom';this.draw();this.loaded=true;this.dispatchEvent(new Event('load'));
    }catch(c){if(b!==this.token)return;this.notice.textContent='Could not display model: '+c.message;this.dispatchEvent(new CustomEvent('error',{detail:c.message}))}
  }
  draw(){
    if(!this.renderer||!this.scene||!this.camera)return;let a=this.canvas.clientWidth,b=this.canvas.clientHeight;if(!a||!b)return;this.renderer.setSize(a,b);this.renderer.exposure=Math.max(.1,Number(this.getAttribute('exposure'))||1);this.camera.aspect=a/b;this.camera.updateProjectionMatrix();
    if(this.mesh){let c=this.center,d=this.size*this.zoom,e=this.angle,f=this.pitch;this.camera.position.set(c[0]+d*Math.sin(e)*Math.cos(f),c[1]+d*Math.sin(f),c[2]+d*Math.cos(e)*Math.cos(f));this.camera.lookAt(c[0],c[1],c[2])}
    this.renderer.render(this.scene,this.camera);
  }
}
customElements.define('mesh-viewer',meshviewer);
