package com.rwadar.smoketest;
import android.app.Instrumentation;
import android.app.UiAutomation;
import android.graphics.Rect;
import android.net.LocalServerSocket;
import android.net.LocalSocket;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Xml;
import android.view.accessibility.AccessibilityNodeInfo;
import java.io.*;
import org.xmlpull.v1.XmlSerializer;

// Disposable read-only CI helper: no Activity, files, INTERNET permission or product code.
public final class DumpRunner extends Instrumentation {
  @Override public void onCreate(Bundle args) { super.onCreate(args); start(); }
  private static String value(CharSequence v) { return v==null ? "" : v.toString(); }
  private static void node(XmlSerializer xml, AccessibilityNodeInfo info, int depth) throws Exception {
    if(depth>100) throw new IllegalStateException("Hierarchy too deep");
    Rect b=new Rect(); info.getBoundsInScreen(b);
    xml.startTag(null,"node");
    xml.attribute(null,"text",value(info.getText()));
    xml.attribute(null,"content-desc",value(info.getContentDescription()));
    xml.attribute(null,"package",value(info.getPackageName()));
    xml.attribute(null,"class",value(info.getClassName()));
    xml.attribute(null,"clickable",Boolean.toString(info.isClickable()));
    xml.attribute(null,"enabled",Boolean.toString(info.isEnabled()));
    xml.attribute(null,"focused",Boolean.toString(info.isFocused()));
    xml.attribute(null,"password",Boolean.toString(info.isPassword()));
    xml.attribute(null,"checkable",Boolean.toString(info.isCheckable()));
    xml.attribute(null,"checked",Boolean.toString(info.isChecked()));
    xml.attribute(null,"selected",Boolean.toString(info.isSelected()));
    xml.attribute(null,"scrollable",Boolean.toString(info.isScrollable()));
    xml.attribute(null,"can-scroll-forward",Boolean.toString((info.getActions() & AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)!=0));
    xml.attribute(null,"can-scroll-backward",Boolean.toString((info.getActions() & AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD)!=0));
    xml.attribute(null,"visible",Boolean.toString(info.isVisibleToUser()));
    xml.attribute(null,"bounds","["+b.left+","+b.top+"]["+b.right+","+b.bottom+"]");
    for(int i=0;i<info.getChildCount();i++) {
      AccessibilityNodeInfo child=info.getChild(i);
      if(child!=null) { try { node(xml,child,depth+1); } finally { child.recycle(); } }
    }
    xml.endTag(null,"node");
  }
  private static String request(InputStream in) throws Exception {
    StringBuilder s=new StringBuilder(); int c;
    while((c=in.read())!=-1 && c!='\n') {
      if(c<'0'||c>'9'||s.length()>=30) throw new IOException("Invalid request");
      s.append((char)c);
    }
    if(c!='\n'||s.length()==0) throw new IOException("Incomplete request");
    return s.toString();
  }
  @Override public void onStart() {
    try {
      UiAutomation automation=getUiAutomation();
      // AF_UNIX abstract socket: adb alone forwards to runner loopback. Nothing is persisted.
      LocalServerSocket server=new LocalServerSocket("rwadar_qa_snapshot_140");
      try {
        while(true) {
          LocalSocket socket=server.accept();
          try {
            socket.setSoTimeout(10000);
            String nonce=request(socket.getInputStream());
            // Android35 runner supports clearCache; no cached root may answer a new request.
            long requestStarted=SystemClock.uptimeMillis();
            automation.clearCache();
            AccessibilityNodeInfo root=null;
            long deadline=SystemClock.uptimeMillis()+1500;
            while(root==null && SystemClock.uptimeMillis()<deadline) {
              root=automation.getRootInActiveWindow();
              if(root!=null && !root.refresh()) { root.recycle(); root=null; }
              if(root==null) SystemClock.sleep(50);
            }
            long rootReady=SystemClock.uptimeMillis();
            byte[] payload=new byte[0];
            if(root!=null) {
              try {
                StringWriter writer=new StringWriter(); XmlSerializer xml=Xml.newSerializer();
                xml.setOutput(writer); xml.startDocument("UTF-8",true);
                xml.startTag(null,"hierarchy"); node(xml,root,0);
                xml.startTag(null,"snapshot-metrics");
                xml.attribute(null,"root-ms",Long.toString(rootReady-requestStarted));
                xml.attribute(null,"tree-ms",Long.toString(SystemClock.uptimeMillis()-rootReady));
                xml.endTag(null,"snapshot-metrics"); xml.endTag(null,"hierarchy");
                xml.endDocument(); payload=writer.toString().getBytes("UTF-8");
                if(payload.length>8*1024*1024) throw new IOException("Snapshot too large");
              } finally { root.recycle(); }
            }
            OutputStream out=socket.getOutputStream();
            out.write((nonce+"\n"+payload.length+"\n").getBytes("US-ASCII"));
            out.write(payload); out.flush();
          } catch(Exception ignored) {
            // Never print UI, exception args, XML or credential values.
          } finally { socket.close(); }
        }
      } finally { server.close(); }
    } catch(Throwable error) {
      Bundle result=new Bundle(); result.putString("rwadar_error_class",error.getClass().getSimpleName());
      finish(1,result);
    }
  }
}
