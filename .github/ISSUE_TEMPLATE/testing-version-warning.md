---
name: ⚠️ Testing Version - DO NOT USE IN PRODUCTION
about: This template explains why you shouldn't file regular issues for this version
title: "⚠️ This is a testing version with critical bugs"
labels: ["testing-version", "documentation"]
assignees: []
---

## 🚨 TESTING VERSION WARNING

**This repository contains a testing version with critical bugs that prevent normal operation.**

### ❌ Do NOT use this for:
- Production deployments
- Important data storage
- Public file sharing
- Mission-critical applications

### ✅ This version is only for:
- Development and testing
- Bug reproduction
- Contributing fixes
- Local experimentation

## 📖 Before Filing Issues

**Please read [TESTING-STATUS.md](../../TESTING-STATUS.md) first!**

This document lists all known critical issues including:
- ZFS route registration conflicts
- File upload failures  
- Storage path mismatches
- Docker configuration problems

## 🤝 Want to Help?

If you want to contribute to fixing these issues:

1. Check the critical issues in [TESTING-STATUS.md](../../TESTING-STATUS.md)
2. Look at the source code around the failing components
3. Submit a PR with fixes
4. Help with testing and validation

## 🔄 Looking for Stable Version?

For a stable version of NodeCast, please refer to the original upstream repository.

**This fork is experimental and contains known breaking bugs.**