(function (root) {
  'use strict';
  const opt = (id, label, hint, reply, effect = {}, gate) => ({ id, label, hint, reply, effect, gate });
  const has = (s, f) => s.flags.includes(f);
  const flag = (f, note) => ({ flag: f, note });
  const bond = (who, n, note) => ({ bond: who, min: n, note });
  const arc = s => s.flags.find(f => f.startsWith('arc:'))?.slice(4);
  const paths = {
    manager: {
      title: '编外店长', lead: '你负责占位置，大家负责给你腾位置。',
      text: '顾客说猫挡着取餐牌了。小麦想了想，把取餐牌挪开。你继续睡。你的岗位终于稳定下来：不上班，但上班的人都得先看看你在哪儿。',
      scenes: [
        ['取餐牌摆到了你的垫子旁边。', '大家绕来绕去，你的午觉多了很多脚步声。', '把垫子拖到安静的一侧', '小麦跟着挪了牌子：“行，这边留给你。”你解决了一次门店动线问题，方法是嫌吵。'],
        ['小麦拿来一块“请勿打扰”的牌子。', '昨天挪出来的位置，今天真的没人占。', '在牌子后面试睡', '你刚闭眼，小麦就提醒旁边的人轻一点。没有任命书，但待遇已经执行。'],
        ['今天，有人问店长在哪儿。', '小麦指了指店里。你伸了个懒腰，旁边的人误会了。', '坐上自己的专座，接受误会', '你坐下，大家绕开。入职七天，唯一的考勤记录是“今天也在睡”。']
      ], spot: 'door', home: 'chair', items: ['sign', 'bowl'], mood: 'proud'
    },
    traveler: {
      title: '薯条旅行搭子', lead: '老周带薯条，你带老周。',
      text: '你已经学会听见包的拉链声就出门。老周负责带猫粮和薯条，你负责看风景，以及在他准备回家时继续趴着。旅行没有导游，只有一只不想结束的猫。',
      scenes: [
        ['老周把出门的包放到地上。', '里面有水、猫粮，还有给他自己留的位置很小的一袋薯条。', '先坐进去，检查舒适度', '老周拎了拎：“比昨天重。”你看着他，建议先检查薯条。'],
        ['老周问，要不要走远一点。', '今天没有赶着回去的事。码头那边，刚好能看夕阳。', '走到包旁边，等他出发', '他把你的水碗也带上了。你确认这趟不是出差：没有需要你完成的工作。'],
        ['码头到了，薯条也到了。', '风有点大，老周把包转了个方向，替你挡住。', '趴在包上，陪他看水', '老周吃薯条，你吃猫粮。等到太阳快落下，他问回不回，你把下巴又放低了一点。']
      ], spot: 'dock', mood: 'happy'
    },
    host: {
      title: '纸箱包租猫', lead: '本来只想收留一晚，结果住成了满房。',
      text: '狸花带来朋友，朋友又带来朋友。你的小窝开始有人问空位。租金不收，规矩只有一条：谁最后进箱，谁负责把翘起来的纸板压住。',
      scenes: [
        ['新猫真的带着一片纸板来了。', '它没有行李，只有一脸“昨晚说的还算数吧”。', '把两个纸箱并排放', '狸花负责叼软布，新猫负责试躺。你站在中间，看起来像在验收第二套房。'],
        ['今晚又有猫来问能不能挤一挤。', '箱子不大，但隔壁还空着一块干燥的地。', '再腾一个位置，约好不抢垫子', '你们把软布铺平。新猫主动往里挪了挪：当过客人的猫，已经学会招待客人。'],
        ['天黑时，你的小窝满房了。', '狸花探出脑袋，示意最暖的地方还给你留着。', '回到大家给你留的位置', '三只猫挤成一团。你忽然明白，房东最大的福利，是冬天不用自己焐被窝。']
      ], spot: 'shelter', home: 'box', items: ['box', 'mat', 'toy'], mood: 'asleep'
    },
    leader: {
      title: '街区带头猫', lead: '你说走错了，它们说这叫开辟新路线。',
      text: '第一次带路，你绕过头了，却找到一个更热闹的喂食点。从此你每次停下来思考，大家都会安静等着。你没好意思解释：有时候真的只是忘了路。',
      scenes: [
        ['狸花把头一偏：今天你带路？', '身后两只猫已经站好了，就差你迈第一步。', '沿着记住的小巷走', '你在岔路口犹豫了一下。狸花看起来更加信任你了：它以为你在评估。'],
        ['走过头了，但前面有人在添猫粮。', '本来的路在身后，新饭点在眼前。', '先招呼朋友，再一起过去', '大家吃完看着你。你决定不纠正“特别会找饭”这个新印象。'],
        ['今天出门，身后自动排起了队。', '你往左看，它们也往左看。', '带大家绕一圈，再回熟悉的地方', '这次你认得路。大家却觉得不如上次刺激。你宣布：领队也有正常发挥的时候。']
      ], spot: 'street', items: ['toy'], mood: 'proud'
    },
    star: {
      title: '门店顶流', lead: '每周营业一次，每次三分钟。',
      text: '有人拿着你的照片来认猫。你起初很配合，后来发现“今天没见到它”也会被发出去。于是你减少营业，增加睡眠，粉丝称之为保持神秘。',
      scenes: [
        ['有人举着手机里的照片来找你。', '红领巾对上了，脸也对上了，就是本人不太想上班。', '坐好，给他拍三秒', '对方连拍二十张。你只动了一下耳朵，已经完成全部工作量。'],
        ['门口开始有人问你几点出来。', '小麦看向你。你正在睡觉，暂时不接受排班。', '把“请勿打扰”牌子拨到前面', '小麦告诉大家：“醒了再说。”你的营业时间正式改为随缘。'],
        ['今天也有人等你露脸。', '太阳正好，垫子也很软。', '露个头，然后收工', '三分钟后你缩回窝里。大家拍到了猫，你保住了午觉，一场成功的双赢。']
      ], spot: 'door', home: 'chair', items: ['scarf', 'sign'], mood: 'annoyed'
    },
    garden: {
      title: '秘密花园退休猫', lead: '别人以为你在流浪，你在等下午两点的阳光。',
      text: '花架下不漏雨，午后有一小块太阳。你把软垫挪进去，给自己留了一条回饭点的路。没有谁宣布你退休，但从这天起，你确实开始享受退休生活。',
      scenes: [
        ['小巷尽头，竟然还有一座小花园。', '花架下面是干的。两点以后，阳光刚好照到空地上。', '记住入口，试躺一会儿', '你换了三个角度，确认这不是路过，是看房。'],
        ['阳光又准时落到了昨天的位置。', '这地方安静得能听见叶子动。', '把软垫搬进花架下面', '你给新家铺好床，再沿原路走回饭点。吃饭和休息可以在两个地方，这叫生活有边界。'],
        ['下午两点，花园准时开灯。', '没有人来找你开会，只有一片叶子落在旁边。', '翻个身，把另一面也晒暖', '你闭上眼。今天没有获得新身份，只是获得了完全属于自己的下午。']
      ], spot: 'garden', home: 'garden', items: ['mat'], mood: 'asleep'
    },
    sweet: {
      title: '两个人，一只碗', lead: '碗写了你的名字，等待却慢慢变成了三个人的事。',
      text: '小麦问老周怎么又来了。老周说，来送猫碗。碗昨天就送过了，上面还写着“小橘”。你低头吃饭，懒得拆穿。后来他们都没再找借口，只说：走，看看猫。',
      scenes: [
        ['老周递来一只写着“小橘”的碗。', '小麦看了一眼：“给它的，你别抢。”老周说自己带了薯条。', '在两个人中间坐好，等开饭', '小麦添猫粮，老周把碗扶稳。你负责吃，他们负责聊。原来一顿饭能让三位都满意。'],
        ['小麦还没下班，老周已经来了。', '他说今天路过得早。你看了看他手里的第二只猫碗。', '陪他等一会儿，给小麦留个位置', '小麦出来时，老周把薯条递过去。你往旁边挪了一点。今晚不用挤，也没有谁先走。'],
        ['今天，谁也没有说自己只是路过。', '小麦带着猫粮，老周带着薯条。你的碗被摆在两个人中间。', '留在他们中间，把饭慢慢吃完', '小麦摸摸你，老周说下次还来。你在自己的名字旁边蹭了蹭：明天有饭，也有人等。']
      ], spot: 'door', items: ['bowl', 'mat'], mood: 'happy', hidden: true
    },
    mooch: {
      title: '全街都以为你是别人家的猫', lead: '谁都认识你，谁都以为别人负责。',
      text: '小麦以为老周养你，老周以为店里养你，狸花以为你有背景。你没有撒谎，只是一直没抽出时间解释。毕竟店门口刚开饭，街角又开始叫你了。',
      scenes: [
        ['两个饭点，开饭时间居然不同。', '你在店门口吃过，狸花又来叫你。它以为你还没吃。', '跟过去看看，吃饱就陪它坐会儿', '你没有硬塞第二顿，只是把新饭点记住了。预备方案，从不嫌多。'],
        ['老周问小麦：“它是你养的吗？”', '小麦说：“我以为是你。”狸花在旁边，表情像听到了商业机密。', '低头舔爪，让他们继续讨论', '他们最后决定，谁先到谁添粮。你的人生第一次拥有了排班表，执行人却不是你。'],
        ['三个方向都有人招呼你。', '你不用一次吃三顿，只要知道明天还能去哪儿。', '按自己的路线，挨个打个招呼', '你走完一圈，回到老地方。今天最大的收获不是吃了多少，是谁也没让你担心明天。']
      ], spot: 'street', items: ['bowl'], mood: 'proud', hidden: true
    }
  };
  function node(s) {
    const a = arc(s);
    if (s.step === 8) return {
      id: 'opportunities', title: '今天，想去哪儿看看？',
      text: '门口有人搬椅子，小巷尽头有花香，狸花在招呼你。不着急，挑一个想去的地方。', spot: 'door', options: [
        opt('people', '留在门口，看看人类在忙什么', '多待一会儿，也许会被安排一个位置。', '小麦挪开椅子，让你在旁边待着。门口的日常，开始有了你的份。', { flags: ['chapter:people'], bonds: { clerk: 1 }, routes: { social: 2 }, mood: 'happy' }),
        opt('streets', '往小巷深处走，找点新地方', '熟悉的屋檐以外，还有没走过的路。', '你沿着干燥的墙边慢慢走。花香在前面，回去的路也记住了。', { flags: ['chapter:streets', 'dryspot'], routes: { explorer: 2 }, spot: 'street', mood: 'proud' }),
        opt('cats', '跟狸花走，看看它叫你做什么', '猫朋友的日程，通常比人类有意思。', '狸花等你靠近才往前走。街角还有一只新猫，你们先互相闻了闻。', { flags: ['chapter:cats'], bonds: { cats: 1 }, routes: { crew: 2 }, spot: 'street', mood: 'playful' })
      ]
    };
    if (s.step === 9) {
      const begin = (id, label, hint, reply, extra = {}, gate) => opt(id, label, hint, reply, { flags: ['arc:' + id], milestone: '接下来，有了新的打算', mood: 'happy', ...extra }, gate);
      if (has(s, 'chapter:people')) return {
        id: 'people-invitation', title: '今天，你打算怎样和他们相处？',
        text: '小麦在收拾门口，老周又路过这里。你可以留下，也可以试着把这位人类带出去走走。', spot: 'door', options: [
          s.items.includes('scarf') ? begin('star', '戴好红领巾，配合拍张照片', '看看照片发出去以后，会不会有人认得你。', '照片里，你坐得非常端正。拍照的人写下“门口今天有位新同事”，你没有批准，但也没有反对。', { flags: ['arc:star', 'portrait'] })
            : begin('manager', '守住门口的软垫，争取固定位置', '先留下来，慢慢混成这里的常驻猫。', '小麦给你留了块垫子。人类开始默认你在这里，你也开始默认他们该轻一点。', { items: ['mat'] }),
          begin('traveler', '去碰老周的包，想跟他出门', '认识的人愿意带你，才好放心出游。', '老周蹲下来：“想出去看看？”你钻进包边的阴影里，表示这件事可以谈。', {}, bond('regular', 1, '先陪老周吃过饭或打过招呼')),
          begin('sweet', '陪老周等小麦忙完', '两个人都认识你，就多等他们一会儿。', '老周问你怎么不走。小麦从门里喊：“等我一下。”你也没走。原来等人这件事，不只有猫在做。', {}, { all: [bond('clerk', 1), bond('regular', 1)], note: '先让小麦和老周都认识你' })
        ]
      };
      if (has(s, 'chapter:streets')) return {
        id: 'street-discovery', title: '小巷分成了两条路。', text: '一边有花架，另一边能绕到街角的喂食点。回店门口的路，你也还记得。', spot: 'street', options: [
          begin('garden', '沿着花香走，找个清静地方', '找一处属于自己的下午。', '你从花架的缝隙钻过去。没有人拦你，只有叶子轻轻碰了碰耳朵。', { flags: ['arc:garden', 'dryspot'], spot: 'garden' }),
          begin('mooch', '把几个熟人的饭点串成一条路', '认识人，也认识猫，才有这么多地方可去。', '你先确认门口的饭碗，再跟狸花走到街角。它问你从哪来，你忙着记路，没顾上回答。', {}, { all: [bond('clerk', 1), bond('regular', 1), bond('cats', 1)], note: '先认识小麦、老周和狸花，才知道各处的饭点' }),
          begin('manager', '逛够了，回店门口争取固定位置', '绕了一圈，还是喜欢热闹的老地方。', '小麦看见你回来，腾出一块垫子。你往上一坐：看过别处以后，这次算主动选择入职。', { items: ['mat'], bonds: { clerk: 1 }, spot: 'door' })
        ]
      };
      return {
        id: 'cats-invitation', title: '新猫没有窝，狸花想出去逛。', text: '一个在看你的纸箱，一个在看街角。你可以招待客人，也可以做这次出门的带路猫。', spot: 'street', options: [
          begin('host', '给新猫腾个窝，今晚一起住', '把临时借住，慢慢变成热闹的小家。', '你领它到干燥的屋檐下。狸花叼来一片纸板：新房客还没住下，装修队先到了。', { items: ['box', 'mat'], home: 'box', flags: ['arc:host', 'welcomed'], bonds: { cats: 1 }, spot: 'shelter' }),
          begin('leader', '这回我带路，大家跟我走', '先从熟悉的小巷开始，走错也一起找。', '狸花退到你旁边，新猫跟在后面。你第一次发现，平时走惯的路，带别人走也会有点紧张。', { flags: ['arc:leader', 'dryspot'], bonds: { cats: 1 } }),
          begin('garden', '今天想独处，去花架下面看看', '交朋友，也可以给自己留点安静时间。', '你和狸花碰了碰鼻子，再独自走进小巷。朋友没有跟来，也没有生气。', { flags: ['arc:garden', 'dryspot'], spot: 'garden' })
        ]
      };
    }
    if (a && [11, 12, 13].includes(s.step)) {
      const path = paths[a], phase = [11, 12, 13].indexOf(s.step);
      const [title, text, label, reply] = path.scenes[phase];
      const wetReply = s.wet ? '你先在屋檐下把毛蹭干。' : '';
      const effects = { wet: false, fed: true, mood: path.mood, spot: path.spot, items: path.items || [], ...(path.home ? { home: path.home } : {}), flags: [`chapter-done:${s.step}`], milestone: phase === 0 ? '约好的事，真的发生了' : phase === 1 ? '这开始变成你的日常了' : '这就是你混出来的生活' };
      if (a === 'sweet') effects.flags.push('sharedDinner');
      if (['host', 'leader'].includes(a)) effects.bonds = { cats: 1 };
      if (phase === 2) effects.flags.push('ending:' + a);
      const alternative = phase === 2
        ? opt('change', a === 'garden' ? '忽然想热闹，回门口讨个位置' : '今天想清静，去花架下面安顿', '今天想换个地方待着，也行。', a === 'garden' ? '你离开花架，小麦在门口腾出一个位置。安静很好，今天的你却想听听熟悉的人说话。' : '你沿着小巷找到花架，把垫子铺在干燥处。不是讨厌谁，只是今天想把下午留给自己。', { wet: false, mood: 'asleep', spot: a === 'garden' ? 'door' : 'garden', home: a === 'garden' ? 'chair' : 'garden', items: ['mat'], flags: ['ending:' + (a === 'garden' ? 'manager' : 'garden')] })
        : opt('detour', '先去找狸花玩一会儿，再回来', '自己的打算不变，顺便陪陪朋友。', wetReply + reply + '忙完，狸花把瓶盖拨过来，你又陪它玩了一会儿。', { ...effects, mood: 'playful', bonds: { cats: 1 }, milestone: '给老朋友留了一点时间' });
      return { id: `${a}-${phase}`, title, text: (s.wet ? '先躲到屋檐下，把湿毛弄干。' : '') + text, spot: path.spot, options: [
        opt('continue', label, phase === 2 ? '把这几天的选择，过成自己的日子。' : '接着做约好的事，看看它会变成什么。', wetReply + reply, effects),
        // Replay earlier local V2 saves, but don't ask players to choose between near-identical actions.
        { ...opt('slow', phase === 2 ? '不急着收工，再多待一会儿' : '慢一点，先在旁边观察', '事情照常发展，你有自己的节奏。', wetReply + (phase === 2 ? '你没有马上走。' : '你在旁边等了一会儿，才慢慢靠近。') + reply, { ...effects, mood: 'happy' }), hidden: true },
        alternative
      ] };
    }
    return null;
  }
  function ending(s) {
    const id = s.flags.find(f => f.startsWith('ending:'))?.slice(7);
    const p = paths[id];
    if (!p) throw new Error('还没有完成最后的生活选择');
    return { id, title: p.title, lead: p.lead, text: p.text, hidden: !!p.hidden, steps: id === arc(s) ? [9, 12] : [9, 13], next: '这次就这样过，也很好。想再玩时，换条路逛逛。' };
  }
  const api = { node, ending, paths };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CatChapters = api;
})(typeof window !== 'undefined' ? window : globalThis);
