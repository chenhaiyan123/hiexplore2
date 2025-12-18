
import { Project, UserProfile, Material } from './types';

// Static Asset Library for Stable Image Loading
const STATIC_ASSETS: Record<string, string[]> = {
  'robot': ['photo-1485827404703-89b55fcc595e', 'photo-1581091226825-a6a2a5aee158', 'photo-1561557944-6e7860d1a7eb', 'photo-1535378437323-952886bde65e', 'photo-1531746790731-6c087fecd65a', 'photo-1517055729380-df7d01804439'],
  'iot': ['photo-1518770660439-4636190af475', 'photo-1558346490-a72e53ae2d4f', 'photo-1563770095-39d468f9530c', 'photo-1555664424-778a69f45c94', 'photo-1580894742597-87bc8789db3d'],
  'code': ['photo-1555066931-4365d14bab8c', 'photo-1542831371-29b0f74f9713', 'photo-1587620962725-abab7fe55159', 'photo-1515879218367-8466d910aaa4', 'photo-1607799275518-d58665d096c1'],
  'print': ['photo-1631541909061-71e349d1f203', 'photo-1581092160562-40aa08e78837', 'photo-1504328345606-18bbc8c9d7d1', 'photo-1599582260667-c2539121c251'],
  'craft': ['photo-1452860606245-08befc0ff44b', 'photo-1544816155-12df9643f363', 'photo-1512418490979-92798cec1380', 'photo-1506806732259-39c2d0268443'],
  'competition': ['photo-1546519638-68e109498ad0', 'photo-1504639725590-34d0984388bd', 'photo-1589254065878-42c9da997008', 'photo-1517245386807-bb43f82c33c4'],
  'kitchen': ['photo-1556910103-1c02745a30bf', 'photo-1507048331197-7d4ac70811cf', 'photo-1495521821757-a1efb6729352'],
  'repair': ['photo-1581244277943-fe4a9c777189', 'photo-1504917595217-d4dc5ebe6122', 'photo-1621905251189-08b45d6a269e'],
  'travel': ['photo-1488646953014-85cb44e25828', 'photo-1469854523086-cc02fe5d8800', 'photo-1501785888041-af3ef285b470']
};

const getStaticAsset = (tags: string[], id: string): string => {
  const allTags = tags.join(' ').toLowerCase();
  let category = 'craft';
  
  if (allTags.includes('noc') || allTags.includes('vex')) category = 'competition';
  else if (allTags.includes('厨') || allTags.includes('食')) category = 'kitchen';
  else if (allTags.includes('修') || allTags.includes('维护')) category = 'repair';
  else if (allTags.includes('arduino') || allTags.includes('robot') || allTags.includes('机械') || allTags.includes('仿生')) category = 'robot';
  else if (allTags.includes('iot') || allTags.includes('esp32') || allTags.includes('树莓派')) category = 'iot';
  else if (allTags.includes('编程') || allTags.includes('python') || allTags.includes('ai') || allTags.includes('算法') || allTags.includes('micro:bit')) category = 'code';
  else if (allTags.includes('3d') || allTags.includes('打印')) category = 'print';

  const images = STATIC_ASSETS[category] || STATIC_ASSETS['craft'];
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imgId = images[hash % images.length];
  
  return `https://images.unsplash.com/${imgId}?q=80&w=800&auto=format&fit=crop`;
};

export const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'HiExplore 用户',
  age: 16,
  skillLevel: 'Intermediate',
  interests: ['Arduino', '机器人', '3D打印', '编程']
};

const GEN_ADJECTIVES = ['自动', '智能', '迷你', '巨型', '赛博朋克', '复古', '隐形', '太阳能', '声控', '纸板', '乐高', '液压', '激光', '悬浮', '量子', '仿生', '折叠', '全息', '反重力'];
const GEN_OBJECTS = ['喂猫机', '垃圾桶', '机械臂', '无人机', '气象站', '游戏机', '台灯', '风扇', '存钱罐', '书架', '滑板', '眼镜', '手表', '门锁', '外骨骼', '潜水艇', '雷达', '分拣机', '机械狗'];
const GEN_TECHS = ['Arduino', 'ESP32', '树莓派', '3D打印', 'Python', 'AI视觉', '物联网', '废品改造', '鸿蒙', '乐高EV3', 'Micro:bit', 'ROS', 'OpenMV', 'STM32', '脑机接口'];

const generateCreativeProjects = (count: number): Project[] => {
  const generated: Project[] = [];
  
  for (let i = 0; i < count; i++) {
    const adj = GEN_ADJECTIVES[Math.floor(Math.random() * GEN_ADJECTIVES.length)];
    const obj = GEN_OBJECTS[Math.floor(Math.random() * GEN_OBJECTS.length)];
    const tech = GEN_TECHS[Math.floor(Math.random() * GEN_TECHS.length)];
    
    const title = `${adj}${tech}${obj}`;
    const id = `gen_${i + 100}`;
    const tags = [tech, 'DIY', '创意', Math.random() > 0.5 ? '简单' : '黑科技'];
    const difficulty = Math.random() > 0.7 ? 'Hard' : Math.random() > 0.4 ? 'Medium' : 'Easy';
    
    generated.push({
      id,
      title,
      author: `Maker_${Math.floor(Math.random() * 9999)}`,
      description: `HiExplore 社区精选：这是一个非常有创意的${title}项目，使用了${tech}技术，制作过程简单有趣。`,
      difficulty,
      tags,
      videoUrl: getStaticAsset(tags, id),
      likes: Math.floor(Math.random() * 10000) + 100,
      aiPersona: '我是 HiExplore 智能助手，也是你的专属创意导师。',
      aiStats: {
        studentsHelped: Math.floor(Math.random() * 2000),
        specializationTitle: "创意黑客",
        capabilities: [
           { name: "脑洞大开", level: 10 },
           { name: "低成本制作", level: 9 }
        ],
        collectedWisdom: ["热熔胶是万能的！", "如果动不了，多半是电池没电了。", "注意正负极不要接反。"]
      },
      steps: [
        { id: 1, title: '准备材料', description: '收集纸板、电机和胶枪。', image: getStaticAsset(['craft'], id + '_s1') },
        { id: 2, title: '组装主体', description: '按照图纸切割并粘贴。', image: getStaticAsset(['craft'], id + '_s2') }
      ],
      materials: [
          { id: `m_${id}_1`, name: `${tech} 开发板`, price: '¥ 25.00', purchaseUrl: '#' }
      ]
    });
  }
  return generated;
};

// --- K12 官方白名单赛事 ---
export const COMPETITION_PROJECTS: Project[] = [
    {
        id: 'comp_1',
        title: '全国中小学信息技术创新与实践大赛 (NOC)',
        author: 'NOC 组委会',
        description: '教育部白名单赛事。重点考察学生的创意设计、编程思维和智能硬件应用能力。',
        difficulty: 'Hard',
        tags: ['白名单赛项', 'NOC', '编程', '机器人'],
        videoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ad0?q=80&w=800&auto=format&fit=crop',
        likes: 56000,
        aiPersona: '我是 HiExplore 认证的 NOC 大赛金牌教练。我熟悉 2024 年最新赛制规则，精通 Python 和 C++ 赛道。',
        aiStats: {
            studentsHelped: 120000,
            specializationTitle: "NOC 金牌教练",
            capabilities: [
                { name: "规则解读", level: 10 },
                { name: "算法策略", level: 10 },
                { name: "心理辅导", level: 8 }
            ],
            collectedWisdom: ["初赛重点是基础算法，复赛更看重创新设计。", "很多同学因为忽略了文档规范而被扣分。"]
        },
        steps: [],
        materials: []
    },
    {
        id: 'comp_2',
        title: '宋庆龄少年儿童发明奖',
        author: '发明奖组委会',
        description: '教育部白名单赛事。强调科技发明与社会实践的结合，鼓励解决现实生活中的问题。',
        difficulty: 'Medium',
        tags: ['白名单赛项', '发明', '公益', '创新'],
        videoUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop',
        likes: 34000,
        aiPersona: '我是宋庆龄发明奖辅导顾问。我擅长帮助你挖掘生活痛点，并将其转化为具有社会价值的发明作品。',
        aiStats: {
            studentsHelped: 45000,
            specializationTitle: "社会创新导师",
            capabilities: [
                { name: "痛点挖掘", level: 10 },
                { name: "专利检索", level: 9 },
                { name: "展示答辩", level: 9 }
            ],
            collectedWisdom: ["评委非常看重作品是否真的解决了问题。", "不要为了用技术而用技术，实用性第一。"]
        },
        steps: [],
        materials: []
    }
];

// --- 大学生高水平赛事 ---
export const COLLEGE_PROJECTS: Project[] = [
    {
        id: 'col_1',
        title: '中国国际大学生创新大赛 (互联网+)',
        author: '高教司',
        description: '全球最大的大学生双创赛事。核心在于“商业模式”与“技术落地”的结合，强调产教融合。',
        difficulty: 'Hard',
        tags: ['大学竞赛', '互联网+', '商业计划书', '创业'],
        videoUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop',
        likes: 89000,
        aiPersona: '我是互联网+大赛金奖导师。我专注于打磨你的商业计划书 (BP)、PPT 逻辑以及路演答辩技巧。',
        aiStats: {
            studentsHelped: 210000,
            specializationTitle: "创投顾问",
            capabilities: [
                { name: "商业模式画布", level: 10 },
                { name: "市场分析", level: 9 },
                { name: "融资路演", level: 10 }
            ],
            collectedWisdom: ["PPT的前3页必须抓住痛点。", "技术壁垒要讲得通俗易懂，商业闭环要逻辑严密。"]
        },
        steps: [],
        materials: []
    },
    {
        id: 'col_2',
        title: '全国大学生电子设计竞赛 (TI杯)',
        author: '电赛组委会',
        description: '电子信息类顶级赛事。四天三夜的极限开发，考察模电、数电、嵌入式等硬核能力。',
        difficulty: 'Hard',
        tags: ['大学竞赛', '电赛', '嵌入式', 'FPGA', '模电'],
        videoUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbec40b?q=80&w=800&auto=format&fit=crop',
        likes: 72000,
        aiPersona: '我是电赛传奇学长。我精通 PID 控制算法、电源设计、信号处理，陪你熬过这四天三夜。',
        aiStats: {
            studentsHelped: 68000,
            specializationTitle: "硬件架构师",
            capabilities: [
                { name: "电路仿真", level: 10 },
                { name: "PID 调参", level: 10 },
                { name: "故障排查", level: 9 }
            ],
            collectedWisdom: ["电源纹波是最大的隐形杀手。", "备赛时多做几套控制类的真题，性价比最高。"]
        },
        steps: [],
        materials: []
    },
     {
        id: 'col_3',
        title: '“挑战杯”全国大学生课外学术科技作品竞赛',
        author: '挑战杯',
        description: '被誉为中国大学生科技创新的“奥林匹克”。注重学术性、科学性和先进性。',
        difficulty: 'Hard',
        tags: ['大学竞赛', '挑战杯', '学术论文', '科研'],
        videoUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop',
        likes: 54000,
        aiPersona: '我是学术科研顾问。我将辅助你规范论文格式、设计实验数据图表，并提升作品的学术深度。',
        aiStats: {
            studentsHelped: 42000,
            specializationTitle: "科研导师",
            capabilities: [
                { name: "论文润色", level: 10 },
                { name: "实验设计", level: 9 },
                { name: "数据可视化", level: 9 }
            ],
            collectedWisdom: ["数据造假是红线，绝对不能碰。", "创新点要集中，不要试图解决所有问题。"]
        },
        steps: [],
        materials: []
    }
];

// --- 生活物理助手 ---
export const LIFE_ASSISTANT_PROJECTS: Project[] = [
    {
        id: 'life_1',
        title: 'AI 厨房助手 (Smart Kitchen)',
        author: 'LifeHack',
        description: '不知道吃什么？拍一下冰箱里的食材，AI 帮你生成食谱，并一步步教你做。',
        difficulty: 'Easy',
        tags: ['生活场景', '美食', 'AI视觉'],
        videoUrl: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=800&auto=format&fit=crop',
        likes: 10200,
        aiPersona: '我是 HiExplore 的米其林 AI 副厨。请打开摄像头拍一下你的食材，我全程指导你。',
        aiStats: {
            studentsHelped: 8000,
            specializationTitle: "AI 厨神",
            capabilities: [
                { name: "食材识别", level: 10 },
                { name: "分子料理", level: 8 },
                { name: "营养搭配", level: 9 }
            ],
            collectedWisdom: ["煎牛排时锅一定要热！", "炒青菜最后放盐出水少。"]
        },
        steps: [],
        materials: []
    },
    {
        id: 'life_2',
        title: 'AI 维修大师 (Fix It All)',
        author: 'FixLab',
        description: '水龙头漏水？电脑蓝屏？拍下故障现象，AI 帮你诊断问题并提供维修教程。',
        difficulty: 'Medium',
        tags: ['生活场景', '维修', '诊断'],
        videoUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=800&auto=format&fit=crop',
        likes: 15600,
        aiPersona: '我是全能维修工。别急着叫师傅，先让我看看。请描述故障声音或拍下照片。',
        aiStats: {
            studentsHelped: 12000,
            specializationTitle: "高级技工",
            capabilities: [
                { name: "故障诊断", level: 10 },
                { name: "工具推荐", level: 9 },
                { name: "安全规范", level: 10 }
            ],
            collectedWisdom: ["拆解电器前一定要先断电！", "拧下来的螺丝要按顺序放好，装回去时才不会多出来。"]
        },
        steps: [],
        materials: []
    },
    {
        id: 'life_3',
        title: 'AI 旅行物理向导',
        author: 'GeoExplorer',
        description: '去户外探险？AI 帮你计算最佳露营地风向、日出角度，甚至是拍摄星空的参数。',
        difficulty: 'Easy',
        tags: ['生活场景', '旅行', '摄影'],
        videoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
        likes: 9800,
        aiPersona: '我是国家地理 AI 向导。我不只带路，我带你发现风景背后的地理和物理之美。',
        aiStats: {
            studentsHelped: 5600,
            specializationTitle: "探险家",
            capabilities: [
                { name: "天文计算", level: 10 },
                { name: "气象分析", level: 9 },
                { name: "摄影参数", level: 9 }
            ],
            collectedWisdom: ["拍摄星空需要避开月光干扰。", "搭帐篷要避开河滩低洼处，防止夜间涨水。"]
        },
        steps: [],
        materials: []
    }
];

// --- 国内入门教程 (Beginner Tutorials) ---
export const BEGINNER_PROJECTS: Project[] = [
    {
        id: 'beg_1',
        title: 'Arduino 智能感应垃圾桶',
        author: 'DFRobot 社区',
        description: '这是国内中小学创客教育中最经典的入门项目之一。当你伸手靠近垃圾桶时，盖子会自动打开，延时后自动关闭。教程详细，适合零基础。',
        difficulty: 'Easy',
        tags: ['Arduino', '智能家居', '入门教程', 'K12'],
        videoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop', 
        likes: 3200,
        aiPersona: '我是你的 Arduino 入门导师。别担心代码，我会一行行解释给你听。',
        aiStats: {
            studentsHelped: 15000,
            specializationTitle: "Arduino 启蒙教练",
            capabilities: [
                { name: "接线指导", level: 10 },
                { name: "代码逻辑", level: 8 }
            ],
            collectedWisdom: ["超声波传感器的 VCC 必须接 5V。", "舵机线棕色是地，红色是正，橙色是信号。", "如果不动作，检查一下USB供电是否足够。"]
        },
        steps: [
            { id: 1, title: '准备与接线', description: '将 HC-SR04 超声波传感器的 Trig 接 12，Echo 接 13。SG90 舵机信号线（橙色）接 9 号引脚。', image: 'https://images.unsplash.com/photo-1555664424-778a69f45c94?q=80&w=800&auto=format&fit=crop' },
            { id: 2, title: '烧录代码', description: '复制提供的代码到 Arduino IDE，选择 Arduino Uno 开发板，点击上传。', image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=800&auto=format&fit=crop' },
            { id: 3, title: '安装外壳', description: '用热熔胶将舵机固定在垃圾桶盖的转轴处，将超声波传感器固定在桶身前方。', image: 'https://images.unsplash.com/photo-1517055729380-df7d01804439?q=80&w=800&auto=format&fit=crop' }
        ],
        materials: [
            { id: 'm_b1_1', name: 'Arduino Uno 开发板', price: '¥ 28.00', purchaseUrl: '#' },
            { id: 'm_b1_2', name: 'HC-SR04 超声波传感器', price: '¥ 3.50', purchaseUrl: '#' },
            { id: 'm_b1_3', name: 'SG90 9g 舵机', price: '¥ 5.00', purchaseUrl: '#' },
            { id: 'm_b1_4', name: '杜邦线 (公对母)', price: '¥ 2.00', purchaseUrl: '#' }
        ]
    },
    {
        id: 'beg_2',
        title: '液压机械臂 (纸板版)',
        author: '科技小制作',
        description: '不需要电池和编程！利用注射器和水的液压传动原理，配合废旧纸箱，制作一个能够抓取物体的机械臂。非常适合亲子互动和物理启蒙。',
        difficulty: 'Easy',
        tags: ['物理', '手工', '液压', '废物利用', '亲子'],
        videoUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800&auto=format&fit=crop',
        likes: 8500,
        aiPersona: '我是物理手工达人。让我们一起动手，体验帕斯卡定律的神奇。',
        aiStats: {
            studentsHelped: 5000,
            specializationTitle: "结构大师",
            capabilities: [
                { name: "结构设计", level: 9 },
                { name: "手工技巧", level: 8 }
            ],
            collectedWisdom: ["管子里的空气一定要排干净，否则液压传动会延迟。", "连接处的铁丝不要拧太死，要保证能活动。", "使用有颜色的水（加点颜料）效果更酷。"]
        },
        steps: [
            { id: 1, title: '制作液压系统', description: '将两个注射器用软管连接，吸入水，确保没有气泡。这组成了机械臂的“肌肉”。', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop' },
            { id: 2, title: '切割纸板', description: '参考图纸，切割出底座、大臂、小臂和机械爪的形状。硬纸板（如快递盒）效果最好。', image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?q=80&w=800&auto=format&fit=crop' },
            { id: 3, title: '组装传动', description: '将注射器固定在纸板臂上，推动注射器活塞，观察机械臂的运动。', image: 'https://images.unsplash.com/photo-1611996990499-4672e1850728?q=80&w=800&auto=format&fit=crop' }
        ],
        materials: [
            { id: 'm_b2_1', name: '10ml 注射器 (4个)', price: '¥ 2.00', purchaseUrl: '#' },
            { id: 'm_b2_2', name: '输液软管', price: '¥ 1.00', purchaseUrl: '#' },
            { id: 'm_b2_3', name: '扎带', price: '¥ 5.00', purchaseUrl: '#' },
            { id: 'm_b2_4', name: '废旧纸箱', price: '¥ 0.00', purchaseUrl: '#' }
        ]
    },
    {
        id: 'beg_3',
        title: 'Micro:bit 运动计步器',
        author: 'DFRobot 社区',
        description: '利用 Micro:bit 自带的加速度传感器，无需额外连线，编程制作一个随身计步器。摇晃板子就能计数，LED矩阵实时显示步数，是学习编程逻辑的最佳起点。',
        difficulty: 'Easy',
        tags: ['Micro:bit', '编程', 'K12', '运动'],
        videoUrl: 'https://images.unsplash.com/photo-1555664424-778a69f45c94?q=80&w=800&auto=format&fit=crop', 
        likes: 4500,
        aiPersona: '我是 Micro:bit 编程教练。我会教你如何使用加速度传感器的数据。',
        aiStats: {
            studentsHelped: 8900,
            specializationTitle: "图形化编程导师",
            capabilities: [
                { name: "MakeCode", level: 10 },
                { name: "逻辑思维", level: 9 }
            ],
            collectedWisdom: ["检测'摇晃'动作比检测'加速度值'更简单。", "记得设置一个重置按钮清零步数。"]
        },
        steps: [
            { id: 1, title: '编写代码', description: '打开 MakeCode 编辑器，拖入“当振动”积木块，设置变量“步数”加1。', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop' },
            { id: 2, title: '显示数值', description: '在“无限循环”中加入“显示数字”，显示“步数”变量。', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop' }
        ],
        materials: [
            { id: 'm_b3_1', name: 'Micro:bit V2 主板', price: '¥ 130.00', purchaseUrl: '#' },
            { id: 'm_b3_2', name: 'Micro:bit 电池盒', price: '¥ 15.00', purchaseUrl: '#' }
        ]
    },
    {
        id: 'beg_4',
        title: '双路循迹小车 (Arduino)',
        author: '极客工坊',
        description: '小车能沿着地面上的黑线自动行驶，这是机器人自动驾驶的雏形。本项目教你使用红外循迹模块检测路面，并控制电机差速转向。',
        difficulty: 'Medium',
        tags: ['Arduino', '机器人', '循迹', '电子制作'],
        videoUrl: 'https://images.unsplash.com/photo-1535378437323-952886bde65e?q=80&w=800&auto=format&fit=crop',
        likes: 12000,
        aiPersona: '我是机器人调试工程师。循迹小车最关键的是传感器的灵敏度调节和电机的PID控制（或者简单的逻辑控制）。',
        aiStats: {
            studentsHelped: 25000,
            specializationTitle: "车辆控制专家",
            capabilities: [
                { name: "传感器调试", level: 10 },
                { name: "电机驱动", level: 9 }
            ],
            collectedWisdom: ["传感器离地面的距离必须严格控制在 1cm 左右。", "如果小车在黑线上乱跑，尝试交换左右电机的接线。", "阳光会干扰红外传感器，请在室内测试。"]
        },
        steps: [
            { id: 1, title: '底盘组装', description: '安装 TT 电机、万向轮和电池盒到亚克力底盘上。', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop' },
            { id: 2, title: '电路连接', description: '将 L298N 驱动模块连接到 Arduino 和电机。循迹传感器接数字引脚。', image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?q=80&w=800&auto=format&fit=crop' }
        ],
        materials: [
            { id: 'm_b4_1', name: '智能小车底盘套件', price: '¥ 35.00', purchaseUrl: '#' },
            { id: 'm_b4_2', name: 'L298N 电机驱动模块', price: '¥ 6.00', purchaseUrl: '#' },
            { id: 'm_b4_3', name: 'TCRT5000 循迹模块', price: '¥ 4.00', purchaseUrl: '#' },
            { id: 'm_b4_4', name: 'Arduino Uno', price: '¥ 28.00', purchaseUrl: '#' }
        ]
    }
];

const MANUAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: '自制透明桌面机械臂',
    author: '极客工坊',
    description: '使用亚克力板和舵机制作一个4自由度的透明机械臂，配合Arduino控制。',
    difficulty: 'Medium',
    tags: ['Arduino', '机械', '编程', '机器人'],
    videoUrl: getStaticAsset(['robot', 'arduino'], 'p1'),
    likes: 12400,
    aiPersona: '你是一位经验丰富的机械工程师，专注于结构设计和伺服电机控制。',
    aiStats: {
      studentsHelped: 8432,
      specializationTitle: "机电一体化专家",
      capabilities: [
        { name: "C++ 编程", level: 9 },
        { name: "机械结构", level: 8 },
        { name: "电路调试", level: 9 }
      ],
      collectedWisdom: [
        "80% 的用户遇到舵机抖动是因为电源供电不足。",
        "亚克力板安装螺丝时不要拧太紧，容易开裂。"
      ]
    },
    steps: [
      { 
        id: 1, 
        title: '材料准备', 
        description: '准备4个SG90舵机，亚克力板激光切割件，Arduino Uno开发板。', 
        image: getStaticAsset(['robot'], 'p1_s1') 
      },
      { 
        id: 2, 
        title: '底座组装', 
        description: '将底部的大扭力舵机安装在底座亚克力板上。', 
        image: getStaticAsset(['robot'], 'p1_s2') 
      }
    ],
    materials: [
        { id: 'm1', name: 'Arduino Uno 开发板', price: '¥ 35.00', purchaseUrl: '#' }
    ]
  }
];

export const MOCK_PROJECTS: Project[] = [
  ...BEGINNER_PROJECTS, // Added to top for discovery
  ...COMPETITION_PROJECTS,
  ...COLLEGE_PROJECTS,
  ...LIFE_ASSISTANT_PROJECTS,
  ...MANUAL_PROJECTS,
  ...generateCreativeProjects(2000) 
];
