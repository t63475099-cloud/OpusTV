/** GLSL snippets — core morph + fog */

export const coreVertex = /* glsl */ `
uniform float uTime;
uniform float uNoiseAmp;
uniform float uPulse;
uniform float uWire;

varying vec3 vNormal;
varying vec3 vPos;
varying float vDistort;

// simplex-ish hash
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.0,i1.z,i2.z,1.0))
    +i.y+vec4(0.0,i1.y,i2.y,1.0))
    +i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

void main(){
  vNormal = normalize(normalMatrix * normal);
  float n = snoise(position * 1.4 + uTime * 0.35);
  float wave = sin(uTime * (1.5 + uPulse) + position.y * 6.0) * uPulse * 0.08;
  float displace = n * uNoiseAmp + wave;
  vDistort = displace;
  vec3 pos = position + normal * displace;
  // slight grid snap when wireframe mode
  pos = mix(pos, floor(pos * 8.0) / 8.0, uWire * 0.35);
  vPos = pos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const coreFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uWire;
uniform float uBloom;
uniform float uPulse;

varying vec3 vNormal;
varying vec3 vPos;
varying float vDistort;

void main(){
  float fres = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0,0.0,1.0)), 0.0), 2.2);
  float band = sin(vPos.y * 12.0 + uTime * (2.0 + uPulse)) * 0.5 + 0.5;
  vec3 col = mix(uColorA, uColorB, band * 0.65 + vDistort * 2.0);
  col += fres * uBloom * vec3(1.0, 0.85, 1.0);
  // cyber grid lines
  float grid = step(0.92, fract(vPos.x * 6.0)) + step(0.92, fract(vPos.y * 6.0));
  col = mix(col, col * 1.4 + vec3(0.2, 0.9, 1.0) * 0.3, grid * uWire);
  float alpha = 0.55 + fres * 0.4;
  gl_FragColor = vec4(col, alpha);
}
`;

export const fogVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fogFragment = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uFogA;
uniform vec3 uFogB;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  float a = hash(i); float b = hash(i+vec2(1.0,0.0));
  float c = hash(i+vec2(0.0,1.0)); float d = hash(i+vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i=0;i<5;i++){ v += a * noise(p); p *= 2.05; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = vUv * 3.0 + uMouse * 0.15;
  float n = fbm(uv + uTime * 0.05);
  float wave = sin((vUv.x + vUv.y) * 18.0 + uTime * 0.8 + uMouse.x * 2.0) * 0.04;
  vec3 col = mix(uFogA, uFogB, n + wave);
  float alpha = 0.22 + n * 0.18;
  gl_FragColor = vec4(col, alpha);
}
`;
