(function (root) {
  'use strict';
  const chapters = typeof module !== 'undefined' && module.exports ? require('./cat-chapters.js') : root.CatChapters;
  const option = (id, label, hint, reply, effect, gate) => ({ id, label, hint, reply, effect, gate });
  const item = (key, note) => ({ item: key, note });
  const bond = (key, min, note) => ({ bond: key, min, note });
  const flag = (key, note) => ({ flag: key, note });
  const items = {
    box: { name: '纸箱办公室', purpose: '挡风的小窝。下雨时需要搬到屋檐下。' },
    mat: { name: '软垫', purpose: '睡觉更舒服；淋湿后可以晒干。' },
    bowl: { name: '专属饭碗', purpose: '有人开始给你留饭，不用每次临时找吃的。' },
    scarf: { name: '红领巾', purpose: '熟客送的标记。拍照时能认出你。' },
    toy: { name: '瓶盖玩具', purpose: '别的猫愿意和你玩，也能用它招呼朋友。' },
    sign: { name: '请勿打扰牌', purpose: '你睡觉的地方有了自己的规矩。' }
  };
  const people = { clerk: { name: '店员小麦', emoji: '🧑‍🍳' }, regular: { name: '下班的阿周', emoji: '🧑‍💼' }, cats: { name: '街角的狸花', emoji: '🐈' } };
  const days = ['先混口饭', '找个落脚处', '开始被记住', '今天有点麻烦', '新猫来了', '轮到别人找你', '今天我做主'];
  const events = ['rain', 'absence', 'photo'];
  function eventIds(seed) {
    const first = seed % 3, second = (first + 1 + (Math.floor(seed / 3) % 2)) % 3;
    return [events[first], events[second]];
  }
  function incident(s, id) {
    if (id === 'rain') return { id, title: '雨说来就来。纸箱不提供防水服务。', text: '路面开始湿了。现在得给自己找个能待的地方。', spot: 'street', weather: 'rain', options: [
      option('clerk', '找店员借个避雨的位置', '他认得你，才会放心让你靠近。', '小麦把你安置在门外的顶棚下。“员工通道不能进，猫咪休息区可以。”你接受了这次岗位调动。', { wet: false, spot: 'shelter', home: 'shelter', bonds: { clerk: 1 }, routes: { social: 1 }, mood: 'happy' }, bond('clerk', 1, '需要先让店员认识你')),
      option('known', '去之前找到的屋檐下', '还记得那条小路，就不用淋雨。', '你熟门熟路地绕到屋檐下。没有人抱你，但也没有一滴雨碰到你。独立生活，验收通过。', { wet: false, spot: 'shelter', home: 'shelter', routes: { explorer: 2 }, mood: 'proud' }, flag('dryspot', '第 1、2 天探索过避雨处才能选')),
      option('dash', '顶着雨，先冲到最近的雨棚', '会淋湿一点，好在马上有地方躲。', '你冲进雨棚，瘦了一圈——只是毛贴住了。雨棚免费，尊严稍微收了一点手续费。', { wet: true, spot: 'shelter', home: 'shelter', routes: { explorer: 1 }, mood: 'wet' })
    ] };
    if (id === 'absence') return { id, title: '等了半天，熟悉的人今天没来。', text: s.version === 2 && s.items.includes('bowl') ? '也许是加班，也许是休息。饭碗里已经有人添了粮，只是今天少了一张熟面孔。' : '也许是加班，也许是休息。今天的饭，得另想办法。', spot: 'door', options: [
      option('bowl', '看看自己的饭碗', '有固定饭碗，就不用一直等人。', '碗里已经留好了猫粮。你决定把“有人惦记”评为一种优秀的自动化。', { fed: true, mood: 'happy', routes: { social: 2 } }, item('bowl', '还没有专属饭碗')),
      option('friend', '跟狸花去它熟悉的喂食点', '认识它，才知道它愿意带路。', '狸花领你绕到街角。你们并排吃完，它没有收导游费，只抢了个靠前的位置。', { fed: true, mood: 'happy', bonds: { cats: 1 }, routes: { crew: 2 }, spot: 'street' }, bond('cats', 1, '需要先认识街角的狸花')),
      option('ask', '去找今天值班的店员', '主动打个招呼，重新混个脸熟。', '你坐在门外认真叫了两声。值班店员找来一点猫粮。你今天的工作量，到此结束。', { fed: true, bonds: { clerk: 1 }, routes: { social: 1 }, mood: 'happy' })
    ] };
    return { id, title: '有人蹲下来：“猫老师，能拍一张吗？”', text: '手机已经举起来了。你可以配合，也可以照常做猫。', spot: 'door', options: [
      option('scarf', '戴着红领巾，坐得像个负责人', '有领巾，这张照片就有了你的标记。', '拍照的人说你“很有管理气质”。你没有回应。负责人的第一项工作，就是少解释。', { mood: 'proud', bonds: { regular: 1 }, flags: ['portrait'], routes: { social: 2 } }, item('scarf', '需要熟客送的红领巾')),
      option('play', '叫狸花过来，一起玩瓶盖', '把朋友和玩具一起带进镜头。', '手机里只有两团模糊的毛。摄影师说这是动态美，你们说这是瓶盖。', { mood: 'playful', bonds: { cats: 1 }, flags: ['portrait'], routes: { crew: 2 } }, item('toy', '需要瓶盖玩具')),
      option('sleep', '翻个身，继续睡', '不营业。顺便把这个位置睡熟。', '照片发出去的标题叫“情绪非常稳定”。你只是没醒。你在这里睡熟了，连脚步声都懒得管。', { mood: 'asleep', routes: { explorer: 1 }, flags: ['portrait'] })
    ] };
  }
  function node(s) {
    if (s.step >= 14) return null;
    if (s.version === 2) {
      const chapter = chapters.node(s);
      if (chapter) return chapter;
    }
    const nodes = [
      { title: '你醒了。今天不用打卡，但肚子要。', text: '麦当劳门外，店员正收拾纸袋，一个下班的人拎着包路过。你的肚子先替你打了招呼。', spot: 'door', options: [
        option('rub', '蹭一下店员的裤腿', '让他注意你，试着混口饭。', '小麦蹲下来：“哪来的小橘？”你没交简历，先领到了一小份猫粮。', { fed: true, mood: 'happy', bonds: { clerk: 1 }, routes: { social: 1 } }),
        option('bag', '按住被风吹跑的纸袋', '帮个小忙，试试能不能留下。', '小麦收起纸袋，把空纸箱放到门外。“你待这儿吧。”没有劳动合同，但有了独立办公室。', { items: ['box'], home: 'box', mood: 'proud', bonds: { clerk: 1 }, routes: { social: 1 } }),
        option('belly', '往地上一躺，把肚子亮出来', '赌路过的人会为你停一下。', '阿周停下脚步，去附近买来猫粮。“我刚下班，你倒挺会躺。”你决定不解释。', { fed: true, mood: 'happy', bonds: { regular: 1 }, routes: { social: 1 } })
      ] },
      { title: '天黑了。今晚睡哪儿？', text: '门外的灯还亮着。墙角有个空纸箱，巷子里有一只狸花正往前走。', spot: 'door', options: [
        option('box', s.items.includes('box') ? '把纸箱搬到背风的墙边' : '占住墙边的空纸箱', '今晚先有自己的位置。', '你在纸箱里踩了三圈，郑重躺下。房产面积不大，但没有房贷。', { items: ['box'], home: 'box', mood: 'asleep', routes: { explorer: 1 } }),
        option('explore', '沿着小巷找个能避雨的地方', '记住屋檐的位置，后面可能用得上。', '你找到了干燥的屋檐，顺便记下怎么绕回来。导航没装，地图已经长在脑子里了。', { flags: ['dryspot'], home: 'shelter', spot: 'shelter', mood: 'asleep', routes: { explorer: 2 } }),
        option('follow', '跟狸花走一段，打个招呼', '认识附近的猫，看看有没有消息。', '狸花先闻了闻你，又把一个瓶盖拨过来。入群没填表，群礼物倒是领了。', { items: ['toy'], bonds: { cats: 1 }, spot: 'street', mood: 'playful', routes: { crew: 2 } })
      ] },
      { title: '第二天，你想把日子过得像样一点。', text: '昨天只是临时落脚。今天可以找人帮忙，也可以自己把周围摸清。', spot: 'door', options: [
        option('mat', '找认识的店员讨块软垫', '他已经见过你，或许愿意照顾一下。', '小麦给你放了块干净旧垫子。你踩了一会儿奶，算是签收。', { items: ['mat'], mood: 'happy', bonds: { clerk: 1 }, routes: { social: 1 } }, bond('clerk', 1, '先和店员打过招呼才好开口')),
        option('roof', '自己找个不漏雨的位置', '给以后的坏天气留一条后路。', '你找到顶棚最靠里的角落。雨水走外侧，你走内侧。生活规划完成了一小部分。', { flags: ['dryspot'], home: 'shelter', spot: 'shelter', mood: 'proud', routes: { explorer: 2 } }),
        option('cap', '拿个瓶盖，邀请狸花一起玩', '从一起玩开始，慢慢混熟。', '狸花把瓶盖踢回来，又踢回来。你们对这项运动的理解高度一致：谁都不用捡球。', { items: ['toy'], bonds: { cats: 1 }, mood: 'playful', spot: 'street', routes: { crew: 2 } })
      ] },
      { title: '阿周下班路过，手里拎着薯条。', text: '他把薯条留给自己，另外给你准备了猫粮。“今天也没上班啊？”', spot: 'door', options: [
        option('wait', '坐在他旁边，陪他吃完', '让这个路过的人开始记住你。', '阿周吃薯条，你吃猫粮。今天这顿饭没人聊 KPI，双方都很满意。', { fed: true, mood: 'happy', bonds: { regular: 2 }, routes: { social: 2 } }),
        option('share', '叫狸花过来，一起吃', '有饭的时候，也想着附近的朋友。', '你给狸花留了一半。它吃完靠着你坐下。没有说谢谢，尾巴倒是碰了你一下。', { fed: true, mood: 'happy', bonds: { cats: 2 }, routes: { crew: 2 } }),
        option('home', '吃完就回自己的地方休息', '不多营业，留点精神观察周围。', '你吃饱后慢慢晃回落脚处。人类管这叫不合群，你管这叫下班。', { fed: true, mood: 'asleep', spot: 'shelter', flags: ['dryspot'], routes: { explorer: 2 } })
      ] },
      { title: '今天，有人先叫了你的名字。', text: '你还没走到门口，小麦已经喊了声“小橘”。原来昨天真的没白混。', spot: 'door', options: [
        option('bowl', '在熟悉的店员面前坐好', '混熟了，就试试争取固定饭碗。', '小麦放下一个小碗：“以后给你留这儿。”你低头检查了一遍，长期饭票终于有了实体。', { items: ['bowl'], fed: true, mood: 'proud', bonds: { clerk: 1 }, routes: { social: 2 } }, bond('clerk', 1, '需要先让店员认识你')),
        option('scarf', '去迎接常来找你的阿周', '他认识你，今天还给你带了东西。', '阿周松松地给你系上红领巾。“以后远远就认得你。”你觉得这份工牌可以接受。', { items: ['scarf'], fed: true, mood: 'proud', bonds: { regular: 1 }, routes: { social: 2 } }, bond('regular', 1, '阿周还没和你混熟')),
        option('route', '跟着送货的人，记住安静的小路', '不用求人，也能多认识一点地方。', '你找到一条避开人群的路，还捡到了没人要的干净软垫。今天的收获，主要靠眼神好。', { items: ['mat'], flags: ['dryspot'], mood: 'proud', routes: { explorer: 2 }, spot: 'street' })
      ] },
      { title: '你决定给自己的生活加一点配置。', text: '有了落脚处，下一步就是让它舒服一点。狸花也在旁边探头探脑。', spot: 'shelter', options: [
        option('nest', '把软垫铺进自己的窝', '已经有垫子，才能这么享受。', '你把垫子踩出一个刚刚好的坑。样板房看起来也许一般，试睡体验非常领先。', { items: ['box'], home: 'box', mood: 'asleep', flags: ['settled'], routes: { explorer: 2 } }, item('mat', '先拿到一块软垫')),
        option('friend', '和狸花一起整理落脚处', '熟悉的猫愿意在这里一起待着。', '狸花叼来一块软布，你负责踩平。合作非常高效，因为没有分工会议。', { items: ['mat'], bonds: { cats: 1 }, mood: 'happy', flags: ['settled'], routes: { crew: 2 } }, bond('cats', 1, '先认识街角的狸花')),
        option('ask', '在门外等小麦忙完', '花点耐心，让他再多认得你一点。', '小麦忙完出来，把纸箱往里挪了挪，又铺上一块软布。你第一次觉得，等人下班也挺值得。', { items: ['box', 'mat'], home: 'box', mood: 'happy', bonds: { clerk: 1 }, routes: { social: 1 }, flags: ['settled'] })
      ] },
      null,
      { title: s.wet ? '雨停了。先把自己晾回一只蓬松的猫。' : '处理完麻烦，你还有半天可以安排。', text: s.wet ? '毛贴在身上怪难受的。旁边有太阳，熟悉的人和猫也陆续回来了。' : '刚才的事过去了。现在可以补点吃的，也可以把住处收拾得更舒服。', spot: 'shelter', options: [
        option('sun', '在太阳下打个盹', '晒干毛和垫子，恢复精神。', '太阳把你慢慢烘蓬松。你翻了个面，保证加热均匀。醒来时，垫子也干了。', { wet: false, mood: 'asleep', routes: { explorer: 2 }, flags: ['weathered'] }),
        option('towel', '找小麦借块干毛巾', '熟悉的店员愿意帮你收拾。', '小麦替你擦干毛，又添了点猫粮。你全程没有配合，但最终验收满意。', { wet: false, fed: true, mood: 'happy', bonds: { clerk: 1 }, routes: { social: 2 }, flags: ['weathered'] }, bond('clerk', 1, '需要先让店员认识你')),
        option('cats', '找狸花一起挤在干燥的窝里', '朋友留的位置，能一起避风。', '狸花往旁边挪了一点。你们挤着睡了一觉，醒来都干了。它那半边比较暖，你假装没发现。', { wet: false, mood: 'happy', bonds: { cats: 1 }, routes: { crew: 2 }, flags: ['weathered'], items: ['mat'] }, bond('cats', 1, '需要先认识街角的狸花'))
      ] },
      { title: '一只新猫，坐进了你常待的位置。', text: '它看着你，你看着它。谁也没交过房租，但气氛像在讨论产权。', spot: 'door', options: [
        option('share', '往旁边挪挪，给它留一块地方', '多一个邻居，也可能多一个朋友。', '新猫试探着挪过来，狸花也凑了过来。你的小窝还没扩建，朋友圈先扩容了。', { mood: 'happy', bonds: { cats: 1 }, routes: { crew: 2 }, flags: ['welcomed'] }),
        option('clerk', '去找小麦，让他给你留个位', '混得够熟，他会替你想办法。', '小麦把你的垫子放到另一个背风的位置。“这边给你。”你没有吵赢，但拿到了安置方案。', { items: ['mat'], home: 'shelter', mood: 'proud', routes: { social: 2 }, flags: ['reserved'] }, bond('clerk', 2, '小麦和你熟悉后，才会特意留位')),
        option('move', '不争了，自己找个更安静的位置', '换个落脚处，先离开这场眼神会议。', '你搬到另一边，那里晒得到太阳。虽然刚开始有点不爽，但你很快发现：新位置没有脚步声。', { mood: 'annoyed', spot: 'shelter', home: 'shelter', flags: ['dryspot', 'reserved'], routes: { explorer: 2 } })
      ] },
      { title: '阿周来了：“谁才是我认识的小橘？”', text: '门口的猫变多了。但相处过的日子，总得留下点区别。', spot: 'door', options: [
        option('scarf', '抬抬下巴，亮出红领巾', '有你自己的标记，不怕认错。', '阿周一眼就认出了你，给你添了猫粮。红领巾没有提高战斗力，但提高了被叫对名字的概率。', { fed: true, mood: 'proud', bonds: { regular: 1 }, routes: { social: 2 } }, item('scarf', '先收到阿周的红领巾')),
        option('greet', '主动走过去，蹭蹭他的鞋', '没有领巾，也能重新混熟一点。', '“哦，是你。”阿周蹲下来，分出一份猫粮。你决定把这双鞋加入常用联系人。', { fed: true, mood: 'happy', bonds: { regular: 1 }, routes: { social: 1 } }),
        option('all', '把狸花和新猫都叫过来', '这顿饭一起吃，热闹一点。', '阿周看着排成一排的猫：“我只是路过，不是来开分店。”嘴上这么说，还是多拿了几个小碗。', { items: ['bowl'], fed: true, mood: 'happy', bonds: { cats: 1 }, routes: { crew: 2 } })
      ] },
      null,
      { title: '小麦问：“你今天想待哪儿？”', text: '他手里拿着一块“请勿打扰”的小牌子。以前怕你挡路，现在先问你的安排。', spot: 'door', options: [
        option('seat', '去他特意留的门外座位', '熟悉的人给你留了一个固定位置。', '牌子摆在你旁边。路过的人开始绕着走。你没有升职，只是睡觉终于有了制度保障。', { home: 'chair', items: ['sign'], mood: 'proud', routes: { social: 2 }, flags: ['reserved'] }, bond('clerk', 2, '需要和小麦混熟，他才会专门留位')),
        option('roof', '回自己最熟悉的屋檐下', '知道自己的地盘，不用谁来安排。', '你叼着小牌子回了屋檐下。地址没有门牌号，但你闭着眼都找得到。', { home: 'shelter', spot: 'shelter', items: ['sign'], mood: 'asleep', routes: { explorer: 2 }, flags: ['reserved'] }, flag('dryspot', '先找到过自己的避雨处')),
        option('group', '把牌子摆到大家一起待的地方', '留一片安静的地方，谁困了都能睡。', '狸花先躺下，新猫跟着躺下。你挂上牌子，觉得管理工作也没有那么难——大家都不干活就行。', { items: ['sign', 'mat'], spot: 'shelter', mood: 'proud', bonds: { cats: 1 }, routes: { crew: 2 }, flags: ['reserved'] })
      ] },
      { title: '第七天，你还没开口，安排已经到了。', text: '门口有人叫你，街角也有猫在等你。这一次，你可以挑自己喜欢的日子过。', spot: 'door', options: [
        option('ticket', '确认一下自己的长期饭票', '专属饭碗加上熟悉的人，就不用每天重新找饭。', '小麦给碗添满，阿周从远处和你打招呼。你忽然发现：今天还没卖萌，饭就已经到了。', { fed: true, mood: 'proud', flags: ['mealplan'], routes: { social: 2 } }, { all: [item('bowl'), { any: [bond('clerk', 2), bond('regular', 2)] }], note: '需要专属饭碗，并和店员或阿周混熟' }),
        option('tour', '去巡视自己找好的落脚点', '先找过避雨处，才知道哪里最舒服。', '你检查了屋檐、纸箱和晒太阳的位置。都不错。你决定今天的巡视工作到此结束，剩下的时间休息。', { wet: false, mood: 'proud', flags: ['territory'], routes: { explorer: 2 }, spot: 'shelter' }, flag('dryspot', '先探索过避雨处')),
        option('gather', '去街角，和猫朋友们碰个头', '愿意一起吃饭、待着，就算有了自己的小圈子。', '狸花给你留了个位置，新猫把瓶盖拨过来。你们没有群名，但每次都能找到彼此。', { items: ['toy'], fed: true, mood: 'playful', bonds: { cats: 1 }, flags: ['gathered'], routes: { crew: 2 }, spot: 'street' })
      ] },
      { title: '七天过去了。今天你想怎么过？', text: '七天前，你只是门口一只没人认识的猫。现在，有些地方和人已经在等你。', spot: 'door', options: [
        option('dock', '跟阿周去码头，看他整点薯条', '跟他混熟了，才会被邀请一起出门。', '阿周带着薯条，你带着自己的口粮。你趴在包上看水，他说人生有时也不用想那么明白。你觉得这句可以，批准。', { fed: true, wet: false, mood: 'happy', spot: 'dock', flags: ['dock'], routes: { social: 1 } }, bond('regular', 2, '需要和阿周混熟，才会被邀请出游')),
        option('nap', '谁也不等，回窝里睡一整天', '有了自己的位置，今天可以彻底休息。', '你把身子团成一团。没有闹钟，没有待办。人类正在努力争取的生活，你先试运行一天。', { wet: false, mood: 'asleep', spot: 'shelter', routes: { explorer: 1 }, flags: ['restday'] }),
        option('party', '叫上附近的猫，出去溜达', '熟悉的朋友，会回应你的邀请。', '狸花跟了上来，新猫也跟了上来。你走在中间，没有谁是领导，但大家都愿意一起走。', { wet: false, fed: true, mood: 'playful', spot: 'street', routes: { crew: 1 }, flags: ['catday'] }, bond('cats', 2, '需要和猫朋友们混熟'))
      ] }
    ];
    if (s.step === 6 || s.step === 10) return incident(s, eventIds(s.seed)[s.step === 6 ? 0 : 1]);
    const current = nodes[s.step];
    if (s.version === 2 && s.step === 4 && !s.bonds.clerk) {
      current.title = '门口又忙起来了，你想先去找谁？';
      current.text = '小麦正在整理东西，还没和你打过招呼。先找熟悉的人，或自己探索一条新路，都可以。';
    }
    if (s.version === 2 && s.step === 7 && !s.wet) {
      current.options[0].hint = '舒服地歇一歇，下午还有自己的安排。';
      current.options[0].reply = '你翻了个面，保证阳光照得均匀。毛本来就是干的，这次纯粹是享受生活。';
      current.options[1].label = '找小麦讨一点吃的，再休息';
      current.options[1].reply = '小麦添了点猫粮，把垫子拍松。你负责验收：先吃，再躺。';
      current.options[2].reply = '狸花往旁边挪了一点。你们挤着睡了一觉。它那半边比较暖，你假装没发现。';
    }
    if (s.step === 11 && s.wet) {
      current.text = '小麦拿来干毛巾：先擦干毛和垫子，再挑一个舒服的位置。以后，这里也有你的安排。';
      current.options = current.options.map(o => ({ ...o, hint: '先擦干毛。' + o.hint, reply: '你把毛和垫子弄干，重新蓬松起来。' + o.reply, effect: { ...o.effect, wet: false } }));
    }
    return { id: `day-${s.step}`, ...current };
  }
  const api = { node, items, people, days, eventIds, ending: chapters.ending };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CatStory = api;
})(typeof window !== 'undefined' ? window : globalThis);
