precision highp float;
uniform float uTime;
uniform float uDelta;
uniform float uFlowSpeed;
uniform float uNoiseScale;
uniform float uNoiseEvolution;
uniform float uCenterGravity;
uniform sampler2D uPositions;
uniform vec2 uResolution;
uniform vec4 uStructures[8];
uniform int uStructureCount;
varying vec2 vUv;

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
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
  i=mod(i,289.0);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=1.0/7.0;
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

vec2 curlNoise2D(vec2 p,float t){
  float eps=0.01;
  float n1,n2;
  n1=snoise(vec3(p.x,p.y+eps,t));
  n2=snoise(vec3(p.x,p.y-eps,t));
  float cx=(n1-n2)/(2.0*eps);
  n1=snoise(vec3(p.x+eps,p.y,t));
  n2=snoise(vec3(p.x-eps,p.y,t));
  float cy=-(n1-n2)/(2.0*eps);
  float s2=2.3;float a2=0.4;
  n1=snoise(vec3(p.x*s2+47.0,(p.y+eps)*s2,t*1.3));
  n2=snoise(vec3(p.x*s2+47.0,(p.y-eps)*s2,t*1.3));
  cx+=(n1-n2)/(2.0*eps)*a2;
  n1=snoise(vec3((p.x+eps)*s2+47.0,p.y*s2,t*1.3));
  n2=snoise(vec3((p.x-eps)*s2+47.0,p.y*s2,t*1.3));
  cy+=-(n1-n2)/(2.0*eps)*a2;
  float s3=4.7;float a3=0.15;
  n1=snoise(vec3(p.x*s3+123.0,(p.y+eps)*s3,t*1.7+89.0));
  n2=snoise(vec3(p.x*s3+123.0,(p.y-eps)*s3,t*1.7+89.0));
  cx+=(n1-n2)/(2.0*eps)*a3;
  n1=snoise(vec3((p.x+eps)*s3+123.0,p.y*s3,t*1.7+89.0));
  n2=snoise(vec3((p.x-eps)*s3+123.0,p.y*s3,t*1.7+89.0));
  cy+=-(n1-n2)/(2.0*eps)*a3;
  return vec2(cx,cy);
}

void main(){
  vec4 posData=texture2D(uPositions,vUv);
  vec2 pos=posData.xy;
  vec2 vel=posData.zw;
  float seed=fract(sin(dot(vUv,vec2(12.9898,78.233)))*43758.5453);
  float phase=seed*6.283;
  float timeOff=uTime*uNoiseEvolution+seed*10.0;
  vec2 noisePos=pos*uNoiseScale;
  vec2 flowForce=curlNoise2D(noisePos,timeOff)*uFlowSpeed;
  float driftAngle=phase+uTime*0.02*(0.5+seed);
  vec2 drift=vec2(cos(driftAngle),sin(driftAngle))*0.0008;
  vec2 toCenter=vec2(0.5)-pos;
  vec2 gravityForce=toCenter*uCenterGravity*0.3;
  vec2 structureForce=vec2(0.0);
  for(int i=0;i<8;i++){
    if(i>=uStructureCount)break;
    vec4 s=uStructures[i];
    vec2 sCenter=s.xy;
    vec2 sSize=s.zw;
    vec2 d=abs(pos-sCenter)-sSize*0.5;
    float dist=length(max(d,0.0))+min(max(d.x,d.y),0.0);
    if(dist<0.06){
      vec2 away=normalize(pos-sCenter+vec2(0.001));
      float rep=smoothstep(0.06,0.0,dist)*0.002;
      structureForce+=away*rep;
      vec2 tang=vec2(-away.y,away.x);
      structureForce+=tang*rep*0.7;
    }
  }
  vec2 boundaryForce=vec2(0.0);
  float margin=0.015;
  if(pos.x<margin)boundaryForce.x=(margin-pos.x)*0.4;
  if(pos.x>1.0-margin)boundaryForce.x=-(pos.x-(1.0-margin))*0.4;
  if(pos.y<margin)boundaryForce.y=(margin-pos.y)*0.4;
  if(pos.y>1.0-margin)boundaryForce.y=-(pos.y-(1.0-margin))*0.4;
  vec2 acceleration=flowForce+gravityForce+boundaryForce+structureForce+drift;
  vel=vel*0.88+acceleration*uDelta;
  float maxSpeed=0.007;
  float speed=length(vel);
  if(speed>maxSpeed)vel=vel/speed*maxSpeed;
  pos+=vel;
  if(pos.x<0.0)pos.x=1.0-seed*0.1;
  if(pos.x>1.0)pos.x=seed*0.1;
  if(pos.y<0.0)pos.y=1.0-seed*0.1;
  if(pos.y>1.0)pos.y=seed*0.1;
  gl_FragColor=vec4(pos,vel);
}
