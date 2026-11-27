/* Written by tools/video/build.cjs: the lessons that open with a short narrated video. */
for (const id of ["add","div","fracadd","mul","neg","order","percent","sub"]) if (window.LESSONS && LESSONS[id]) { LESSONS[id].video = 'video/' + id + '.mp4'; LESSONS[id].poster = 'video/' + id + '.jpg'; }
