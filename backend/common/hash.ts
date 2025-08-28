export class ConsistentHash {
    private nodes: Set<string> = new Set();
    private virtualNodes: Map<number, string> = new Map();
    private sortedPositions: number[] = [];
    private readonly virtualNodeCount: number;

    constructor(virtualNodeCount: number = 150) {
        this.virtualNodeCount = virtualNodeCount;
    }

    addNode(node: string): void {
        this.nodes.add(node);

        // 为每个节点创建虚拟节点
        for (let i = 0; i < this.virtualNodeCount; i++) {
            const virtualKey = `${node}:${i}`;
            const position = this.hash(virtualKey);
            this.virtualNodes.set(position, node);
        }

        // 重新排序位置
        this.sortedPositions = Array.from(this.virtualNodes.keys()).sort((a, b) => a - b);
    }

    delNode(node: string): void {
        if (!this.nodes.has(node)) return;

        this.nodes.delete(node);

        // 删除该节点的所有虚拟节点
        for (let [position, nodeAtPosition] of this.virtualNodes) {
            if (nodeAtPosition === node) {
                this.virtualNodes.delete(position);
            }
        }

        // 重新排序位置
        this.sortedPositions = Array.from(this.virtualNodes.keys()).sort((a, b) => a - b);
    }

    getNodeByKey(key: string): string | null {
        if (this.sortedPositions.length === 0) return null;

        const keyHash = this.hash(key);

        // 二分查找第一个大于等于keyHash的位置
        let left = 0;
        let right = this.sortedPositions.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (this.sortedPositions[mid] >= keyHash) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        // 如果超出范围，回到环的开头
        const targetIndex = left >= this.sortedPositions.length ? 0 : left;
        const position = this.sortedPositions[targetIndex];

        return this.virtualNodes.get(position) || null;
    }

    // 获取所有节点列表
    getAllNodes(): string[] {
        return Array.from(this.nodes);
    }

    // 获取节点数量
    getNodeCount(): number {
        return this.nodes.size;
    }

    // 检查节点是否存在
    hasNode(node: string): boolean {
        return this.nodes.has(node);
    }

    // 获取负载分布（用于监控）
    getLoadDistribution(sampleSize: number = 10000): Record<string, number> {
        const distribution: Record<string, number> = {};

        // 初始化所有节点的计数
        for (const node of this.nodes) {
            distribution[node] = 0;
        }

        // 测试随机key的分布
        for (let i = 0; i < sampleSize; i++) {
            const testKey = `sample_key_${i}_${Date.now()}`;
            const node = this.getNodeByKey(testKey);
            if (node && distribution.hasOwnProperty(node)) {
                distribution[node]++;
            }
        }

        return distribution;
    }

    // 获取节点的虚拟节点数量
    getVirtualNodeCount(node: string): number {
        if (!this.nodes.has(node)) return 0;

        let count = 0;
        for (const nodeAtPosition of this.virtualNodes.values()) {
            if (nodeAtPosition === node) {
                count++;
            }
        }
        return count;
    }

    // 性能统计
    getStats() {
        return {
            nodeCount: this.nodes.size,
            virtualNodeCount: this.virtualNodes.size,
            avgVirtualNodesPerNode: this.nodes.size > 0 ? this.virtualNodes.size / this.nodes.size : 0,
            nodes: this.getAllNodes()
        };
    }

    getRandomNode(): string | null {
        const nodes = this.getAllNodes();
        if (nodes.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * nodes.length);
        return nodes[randomIndex];
    }

    private hash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
        }
        return Math.abs(hash);
    }
}