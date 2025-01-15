// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MMCToken.sol";
import "./MMCERC721Coin.sol";

contract CourseMarket is Ownable {
    // YiDeng代币合约实例
    MMCToken public mmcToken;
    MMCERC721Coin public mmcNFT;
    // 添加 Oracle 地址
    address public oracle;

    constructor(
        address payable _mmcToken,
        address payable _mmcNFT,
        address _oracle
    ) Ownable(msg.sender) {
        mmcToken = MMCToken(_mmcToken);
        mmcNFT = MMCERC721Coin(_mmcNFT);
        oracle = _oracle;
    }

    // 添加修改 oracle 地址的方法
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle address");
        oracle = _oracle;
    }

    // 课程结构体定义
    struct Course {
        string web2CourseId; // Web2平台的课程ID
        string name; // 课程名称
        uint256 price; // 课程价格(MMC代币)
        bool isActive; // 课程是否可购买
        address creator; // 课程创建者地址
        string metadataURI;  // 添加元数据 URI 字段，包含课程图片等信息
    }

    // 存储所有课程的映射：courseId => Course
    mapping(uint256 => Course) public courses;

    // web2CourseId到courseId的映射关系
    mapping(string => uint256) public web2ToCourseId;

    // 用户购买记录映射：用户地址 => courseId => 是否购买
    mapping(address => mapping(uint256 => bool)) public userCourses;

    // 课程总数计数器
    uint256 public courseCount;

    // 定义事件，记录课程购买
    event CoursePurchased(
        address indexed buyer,
        uint256 indexed courseId,
        string web2CourseId
    );

    // 添加课程完成事件
    event CourseCompleted(
        address indexed student,
        uint256 indexed courseId,
        string web2CourseId,
        uint256 nftTokenId
    );

    /**
     * @notice 使用web2CourseId购买课程
     * @param web2CourseId Web2平台的课程ID
     * @dev 用户通过Web2课程ID购买课程，自动查找对应的链上课程ID
     */
    function purchaseCourse(string memory web2CourseId) external {
        // 获取链上课程ID
        uint256 courseId = web2ToCourseId[web2CourseId];

        // 确保课程存在
        require(courseId > 0, "Course does not exist");

        // 获取课程信息
        Course memory course = courses[courseId];

        // 确保课程处于可购买状态
        require(course.isActive, "Course not active");

        // 确保用户未购买过该课程
        require(!userCourses[msg.sender][courseId], "Already purchased");

        // 确保web2CourseId匹配
        require(
            keccak256(abi.encodePacked(course.web2CourseId)) ==
                keccak256(abi.encodePacked(web2CourseId)),
            "Course ID mismatch"
        );

        // 调用MMC代币合约的transferFrom函数，转移代币给课程创建者
        require(
            mmcToken.transferFrom(
                msg.sender, // 从购买者账户
                course.creator, // 转给课程创建者
                course.price // 转移课程价格对应的代币数量
            ),
            "Transfer failed"
        );

        // 记录购买状态
        userCourses[msg.sender][courseId] = true;

        // 触发购买事件
        emit CoursePurchased(msg.sender, courseId, web2CourseId);
    }

    /**
     * @notice 检查用户是否已购买课程
     * @param user 用户地址
     * @param web2CourseId Web2平台的课程ID
     * @return bool 是否已购买
     */
    function hasCourse(
        address user,
        string memory web2CourseId
    ) external view returns (bool) {
        uint256 courseId = web2ToCourseId[web2CourseId];
        require(courseId > 0, "Course does not exist");
        return userCourses[user][courseId];
    }

    /**
     * @notice 添加新课程
     * @param web2CourseId Web2平台的课程ID
     * @param name 课程名称
     * @param price 课程价格(MMC代币)
     * @param metadataURI 元数据 URI
     */
    function addCourse(
        string memory web2CourseId,
        string memory name,
        uint256 price,
        string memory metadataURI  // 添加元数据参数
    ) external onlyOwner {
        require(price > 0, "Price must be greater than 0");
        require(bytes(name).length > 0, "Course name cannot be empty");
        require(bytes(web2CourseId).length > 0, "Web2 course ID cannot be empty");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        require(web2ToCourseId[web2CourseId] == 0, "Course already exists");

        courseCount++;

        courses[courseCount] = Course({
            web2CourseId: web2CourseId,
            name: name,
            price: price,
            isActive: true,
            creator: msg.sender,
            metadataURI: metadataURI  // 保存元数据 URI
        });

        web2ToCourseId[web2CourseId] = courseCount;
    }

    // 更新课程状态
    function updateCourseStatus(
        uint256 courseId,
        bool isActive
    ) external onlyOwner {
        require(courseId > 0 && courseId <= courseCount, "Invalid course ID");
        courses[courseId].isActive = isActive;
    }

    // 更新课程价格
    function updateCoursePrice(
        uint256 courseId,
        uint256 newPrice
    ) external onlyOwner {
        require(courseId > 0 && courseId <= courseCount, "Invalid course ID");
        require(newPrice > 0, "Price must be greater than 0");
        courses[courseId].price = newPrice;
    }

    // /**
    //  * @notice 获取用户购买的所有课程
    //  * @param user 用户地址
    //  * @return 课程信息数组，包含课程ID和详细信息
    //  */
    function getUserPurchasedCourses(
        address user
    )
        external
        view
        returns (uint256[] memory courseIds, Course[] memory courseDetails)
    {
        // 首先计算用户购买的课程数量
        uint256 purchaseCount = 0;
        for (uint256 i = 1; i <= courseCount; i++) {
            if (userCourses[user][i]) {
                purchaseCount++;
            }
        }

        // 创建返回数组
        courseIds = new uint256[](purchaseCount);
        courseDetails = new Course[](purchaseCount);

        // 填充数组
        uint256 currentIndex = 0;
        for (uint256 i = 1; i <= courseCount; i++) {
            if (userCourses[user][i]) {
                courseIds[currentIndex] = i;
                courseDetails[currentIndex] = courses[i];
                currentIndex++;
            }
        }

        return (courseIds, courseDetails);
    }

    // 修改返回的课程结构
    struct CourseView {
        string web2CourseId;
        string name;
        uint256 price;
        bool isActive;
        address creator;
        bool purchased;  // 添加购买状态字段
        string metadataURI;  // 添加元数据 URI 字段
    }

    // 修改分页查询函数
    function getCoursesByPage(
        address user,  // 如果未连接钱包，前端传入 address(0)
        uint256 page,
        uint256 pageSize
    ) external view returns (CourseView[] memory, uint256) {
        // 如果是零地址，则将 user 设为 msg.sender
        address actualUser = user == address(0) ? msg.sender : user;
        
        require(pageSize > 0, "Page size must be greater than 0");
        
        uint256 startIndex = page * pageSize;
        require(startIndex <= courseCount, "Page out of bounds");
        
        uint256 returnSize = pageSize;
        if (startIndex + pageSize > courseCount) {
            returnSize = courseCount - startIndex;
        }
        
        CourseView[] memory result = new CourseView[](returnSize);
        
        for (uint256 i = 0; i < returnSize; i++) {
            uint256 courseId = startIndex + i + 1;
            Course memory course = courses[courseId];
            
            result[i] = CourseView({
                web2CourseId: course.web2CourseId,
                name: course.name,
                price: course.price,
                isActive: course.isActive,
                creator: course.creator,
                purchased: userCourses[actualUser][courseId],
                metadataURI: course.metadataURI  // 添加元数据 URI
            });
        }
        
        return (result, courseCount);
    }

    // 修改课程完成方法，只允许 oracle 调用
    function completeCourse(
        address student,
        string memory web2CourseId
    ) external {
        // 只允许 oracle 调用
        require(msg.sender == oracle, "Only oracle can complete course");
        
        uint256 courseId = web2ToCourseId[web2CourseId];
        require(courseId > 0, "Course does not exist");
        require(userCourses[student][courseId], "Course not purchased");

        Course memory course = courses[courseId];
        
        // 铸造 NFT 作为课程完成证明
        uint256 tokenId = mmcNFT.safeMint(
            student,
            course.metadataURI  // 使用课程元数据作为 NFT 的元数据
        );

        // 触发课程完成事件
        emit CourseCompleted(
            student,
            courseId,
            web2CourseId,
            tokenId
        );
    }
}
