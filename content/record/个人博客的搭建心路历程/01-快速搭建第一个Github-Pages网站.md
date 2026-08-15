---
title: 01-快速搭建第一个Github-Pages网站
date: 2026-08-13 12:52:53
lastmod: 2026-08-16
weight: "1"
---

## 搭建个人（组织）类型的网站
### Step1： 新建一个项目
登录Github： [https://github.com/](https://github.com/) ，在顶部菜单栏点击“+”，然后“New repository”新建仓库，输入项目的相关信息，然后“Create repository”创建仓库：  

![](/00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172158.png)

### Step2： 创建一个界面文件
首先创建一个文件：  
![](/00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172307.png)

输入文件内容，点击提交：  
![](/00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172311.png)

输入提交信息，点击提交  
![](/00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172314.png)
### Step3： 设置Github Pages
点击Settings：  

![](/00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172318.png)

设置Github Pages：  

![](/00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172326.png)


### Step4： 保存并访问
点击上图的保存，然后不断刷新保存之后的页面，直至出现GtihubPages的地址：  
然后就可以通过`你的github用户名.github.io`来访问，比如我的是`laotouzzz.github.io` 
![](/00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172335.png)
点击跳转之后，可以看到已经为该项目创建了静态网站了

## 使用自己的域名访问

>使用DNSHE提供的免费域名并接入到Cloudflare，配置好后将域名放到GitHub Pages的Custom domin里面


![](/00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172341.png)
### 配置DNS
第一步：进入DNS-记录，删除全部的记录

![](/00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172345.png)

![](/00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172351.png)

第二步：添加CNAME记录
>类型：CNAME
>名称：你的子域名前缀，例如laotouzzz
>目标：用户名.github.io. 末尾必须带英文小数点
>代理状态：已代理
>TTL：自动

![](00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172355.png)


### 配置SSL/TLS
第一步：SSL/TLS-概述，加密模式设置为完整

![](/00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172401.png)


第二步：SSL/TLS-边缘证书：开启始终使用HTTPS，关闭随机加密，TLS1.3打开。

![](/00-assets/record/个人博客的搭建心路历程/01-快速搭建第一个Github-Pages网站/20260815-172404.png)


## 相关资源
[https://blog.csdn.net/qq_20042935/article/details/133920722](https://blog.csdn.net/qq_20042935/article/details/133920722)

