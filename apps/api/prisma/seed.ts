import { PrismaClient, AdminRole, BrandType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 重卡维修部位分类：一级 -> 二级
const SKILL_TREE: Record<string, string[]> = {
  发动机系统: ['整机', '燃油系统', '涡轮增压', '冷却系统', '润滑系统', '正时'],
  '后处理/电控': ['ECU', '故障码诊断', 'SCR/尿素', 'DPF'],
  '变速箱/传动': ['手动变速箱', 'AMT', '离合器', '传动轴', '分动箱'],
  '车桥/悬挂': ['前桥', '后桥', '差速器', '钢板弹簧', '空气悬挂'],
  制动系统: ['气刹', 'ABS/EBS', '鼓刹/盘刹', '驻车制动'],
  电气系统: ['起动充电', '线路', '仪表灯光', '传感器'],
  转向系统: ['方向机', '助力泵', '转向拉杆'],
  液压系统: ['举升', '液压缸'],
  '车身/驾驶室': ['驾驶室翻转', '空调', '门窗内饰'],
  轮胎轮毂: ['轮胎', '轮毂', '动平衡'],
  '三电/新能源系统': [
    '宁德时代电池',
    '电池BMS',
    '电池热管理',
    '高压配电',
    '充电接口',
    '驱动电机',
    '电机控制器',
    'DC-DC',
    '整车高压线束',
  ],
};

// 品牌
const BRANDS: { name: string; type: BrandType }[] = [
  // 传统重卡
  { name: '欧曼', type: BrandType.TRUCK },
  { name: '解放', type: BrandType.TRUCK },
  { name: '东风天龙', type: BrandType.TRUCK },
  { name: '重汽豪沃(HOWO)', type: BrandType.TRUCK },
  { name: '汕德卡(SITRAK)', type: BrandType.TRUCK },
  { name: '陕汽德龙', type: BrandType.TRUCK },
  { name: '乘龙', type: BrandType.TRUCK },
  { name: '红岩', type: BrandType.TRUCK },
  { name: '大运', type: BrandType.TRUCK },
  { name: '三一', type: BrandType.TRUCK },
  { name: '沃尔沃(进口)', type: BrandType.TRUCK },
  { name: '斯堪尼亚(进口)', type: BrandType.TRUCK },
  // 新能源重卡
  { name: '深向', type: BrandType.NEW_ENERGY },
  { name: '零一', type: BrandType.NEW_ENERGY },
  // 电池/三电
  { name: '宁德时代', type: BrandType.BATTERY },
];

async function seedSkills() {
  let sort = 0;
  for (const [parentName, children] of Object.entries(SKILL_TREE)) {
    sort += 1;
    // 幂等：一级分类不存在才创建
    let parentRow = await prisma.skillCategory.findFirst({
      where: { name: parentName, parentId: null },
    });
    if (!parentRow) {
      parentRow = await prisma.skillCategory.create({
        data: { name: parentName, sort },
      });
    }

    let childSort = 0;
    for (const childName of children) {
      childSort += 1;
      const exists = await prisma.skillCategory.findFirst({
        where: { name: childName, parentId: parentRow.id },
      });
      if (!exists) {
        await prisma.skillCategory.create({
          data: { name: childName, parentId: parentRow.id, sort: childSort },
        });
      }
    }
  }
}

async function seedBrands() {
  let sort = 0;
  for (const b of BRANDS) {
    sort += 1;
    await prisma.brand.upsert({
      where: { name: b.name },
      update: { type: b.type, sort },
      create: { name: b.name, type: b.type, sort },
    });
  }
}

async function seedAdmin() {
  const username = 'admin';
  const exists = await prisma.adminUser.findUnique({ where: { username } });
  if (!exists) {
    const password = await bcrypt.hash('admin123', 10);
    await prisma.adminUser.create({
      data: { username, password, name: '超级管理员', role: AdminRole.SUPER_ADMIN },
    });
    console.log('已创建默认管理员 admin / admin123（请尽快修改密码）');
  }
}

async function main() {
  await seedSkills();
  await seedBrands();
  await seedAdmin();
  console.log('种子数据初始化完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
